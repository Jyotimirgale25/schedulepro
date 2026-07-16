package com.schedulepro.manager.service;

import com.schedulepro.employee.entity.Invitation;
import com.schedulepro.employee.repository.InvitationRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.manager.dto.request.InviteRequestDTO;
import com.schedulepro.employee.dto.response.InvitationDTO;
import com.schedulepro.common.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerInvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;

    @Transactional
    public InvitationDTO sendInvitation(String managerEmail, InviteRequestDTO request) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        User existingEmployee = userRepository.findByEmail(request.getEmail()).orElse(null);

        if (existingEmployee != null) {
            if (existingEmployee.getManagerId() != null &&
                    existingEmployee.getManagerId().equals(manager.getId())) {
                throw new BadRequestException("This employee is already in your team!");
            }

            List<Invitation> existingInvitations = invitationRepository
                    .findByEmployeeEmailAndStatus(request.getEmail(), "PENDING");
            if (!existingInvitations.isEmpty()) {
                throw new BadRequestException("Invitation already sent to this employee!");
            }
        }

        Invitation invitation = new Invitation();
        invitation.setId(UUID.randomUUID().toString());
        invitation.setManager(manager);
        invitation.setEmployeeEmail(request.getEmail());
        invitation.setEmployeeName(existingEmployee != null ?
                existingEmployee.getFullName() : request.getEmail().split("@")[0]);
        invitation.setDepartment(request.getDepartment());
        invitation.setPosition(request.getPosition());
        invitation.setRole(request.getRole() != null ? request.getRole() : "EMPLOYEE");
        invitation.setStatus("PENDING");
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
        invitation.setMessage(request.getMessage());

        Invitation saved = invitationRepository.save(invitation);
        System.out.println("✅ Invitation sent to: " + request.getEmail());
        System.out.println("✅ Invitation ID: " + saved.getId());

        return convertToDTO(saved);
    }

    public List<InvitationDTO> getPendingInvitations(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<Invitation> invitations = invitationRepository
                .findByManagerIdAndStatus(manager.getId(), "PENDING");

        return invitations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    public List<InvitationDTO> getRejectedInvitations(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<Invitation> invitations = invitationRepository
                .findByManagerIdAndStatus(manager.getId(), "REJECTED");

        return invitations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ ADD THIS METHOD
    @Transactional
    public void cancelInvitation(String invitationId, String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        Invitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getManager().getId().equals(manager.getId())) {
            throw new RuntimeException("You can only cancel your own invitations");
        }

        // ✅ Allow cancellation of REJECTED invitations too
        if ("PENDING".equals(invitation.getStatus()) || "REJECTED".equals(invitation.getStatus())) {
            invitation.setStatus("CANCELLED");
            invitation.setRespondedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
        } else {
            throw new RuntimeException("Only pending or rejected invitations can be cancelled");
        }
    }

    private InvitationDTO convertToDTO(Invitation invitation) {
        return InvitationDTO.builder()
                .id(invitation.getId())
                .managerId(invitation.getManager().getId())
                .managerName(invitation.getManager().getFullName())
                .managerEmail(invitation.getManager().getEmail())
                .employeeEmail(invitation.getEmployeeEmail())
                .employeeName(invitation.getEmployeeName())
                .department(invitation.getDepartment())
                .position(invitation.getPosition())
                .status(invitation.getStatus())
                .message(invitation.getMessage())
                .rejectionReason(invitation.getRejectionReason())
                .createdAt(invitation.getCreatedAt())
                .expiresAt(invitation.getExpiresAt())
                .build();
    }
}