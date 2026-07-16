package com.schedulepro.employee.service;

import com.schedulepro.employee.entity.Invitation;
import com.schedulepro.employee.repository.InvitationRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.dto.response.InvitationDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeInvitationService {

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Returns ONLY PENDING invitations
    public List<InvitationDTO> getMyInvitations(String email) {
        List<Invitation> invitations = invitationRepository
                .findByEmployeeEmailAndStatus(email, "PENDING");

        return invitations.stream()
                .filter(inv -> inv.getExpiresAt() == null || inv.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Returns ACCEPTED & REJECTED (HISTORY)
    public List<InvitationDTO> getInvitationHistory(String email) {

        // Get accepted and rejected invitations
        List<Invitation> invitations =
                invitationRepository.findByEmployeeEmailAndStatusInOrderByUpdatedAtDesc(
                        email,
                        List.of("ACCEPTED", "REJECTED")
                );

        // If no history exists, check whether the employee is already in a team
        if (invitations.isEmpty()) {

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null && user.getManagerId() != null) {

                InvitationDTO joinedTeam = InvitationDTO.builder()
                        .id("CURRENT_TEAM")
                        .managerId(user.getManagerId())
                        .managerName("Current Team")
                        .managerEmail("")
                        .employeeEmail(user.getEmail())
                        .employeeName(user.getFullName())
                        .department(user.getDepartment())
                        .position(user.getPosition())
                        .status("ACCEPTED")
                        .message("Already joined this team")
                        .build();

                return List.of(joinedTeam);
            }
        }

        return invitations.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    @Transactional
    public void deleteHistoryRecord(String invitationId, String email) {
        Invitation invitation = invitationRepository.findByIdAndEmployeeEmail(invitationId, email)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Only allow deleting ACCEPTED or REJECTED invitations
        if (!"ACCEPTED".equals(invitation.getStatus()) && !"REJECTED".equals(invitation.getStatus())) {
            throw new RuntimeException("Only accepted or rejected invitations can be deleted");
        }

        invitationRepository.delete(invitation);
        System.out.println("🗑️ Deleted history record: " + invitationId);
    }

    @Transactional
    public void clearHistory(String email) {
        List<Invitation> history = invitationRepository
                .findByEmployeeEmailAndStatusInOrderByUpdatedAtDesc(email, List.of("ACCEPTED", "REJECTED"));

        if (history.isEmpty()) {
            throw new RuntimeException("No history records found");
        }

        invitationRepository.deleteAll(history);
        System.out.println("🗑️ Cleared all history for: " + email);
    }

    @Transactional
    public User acceptInvitation(String invitationId, String email, String password, String fullName) {
        Invitation invitation = invitationRepository.findByIdAndEmployeeEmail(invitationId, email)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new RuntimeException("Invitation already " + invitation.getStatus());
        }

        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            invitation.setUpdatedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation has expired");
        }

        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null) {
            existingUser.setManagerId(invitation.getManager().getId());
            existingUser.setFullName(fullName);
            User updatedUser = userRepository.save(existingUser);

            invitation.setStatus("ACCEPTED");
            invitation.setRespondedAt(LocalDateTime.now());
            invitation.setUpdatedAt(LocalDateTime.now());
            invitationRepository.save(invitation);

            return updatedUser;
        } else {
            User newUser = new User();
            newUser.setId(UUID.randomUUID().toString());
            newUser.setEmail(email);
            newUser.setUsername(email.split("@")[0]);
            newUser.setPassword(passwordEncoder.encode(password));
            newUser.setFullName(fullName);
            newUser.setRole("EMPLOYEE");
            newUser.setDepartment(invitation.getDepartment());
            newUser.setPosition(invitation.getPosition());
            newUser.setManagerId(invitation.getManager().getId());
            newUser.setIsActive(true);
            newUser.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(newUser);

            invitation.setStatus("ACCEPTED");
            invitation.setRespondedAt(LocalDateTime.now());
            invitation.setUpdatedAt(LocalDateTime.now());
            invitationRepository.save(invitation);

            return savedUser;
        }
    }

    @Transactional
    public void rejectInvitation(String invitationId, String email, String reason) {
        Invitation invitation = invitationRepository.findByIdAndEmployeeEmail(invitationId, email)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        invitation.setStatus("REJECTED");
        invitation.setRejectionReason(reason);
        invitation.setRespondedAt(LocalDateTime.now());
        invitation.setUpdatedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        System.out.println("✅ Invitation " + invitationId + " rejected by " + email);
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
                .respondedAt(invitation.getRespondedAt())
                .build();
    }
}