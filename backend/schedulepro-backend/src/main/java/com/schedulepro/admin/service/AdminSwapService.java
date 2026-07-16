// src/main/java/com/schedulepro/admin/service/AdminSwapService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.SwapActionRequest;
import com.schedulepro.admin.dto.response.AdminSwapResponseDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.SwapRequest;
import com.schedulepro.employee.repository.SwapRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminSwapService {

    private final SwapRequestRepository swapRequestRepository;
    private final UserRepository userRepository;

    public List<AdminSwapResponseDTO> getAllSwapRequests() {
        log.info("Admin fetching all swap requests");
        List<SwapRequest> swaps = swapRequestRepository.findAll();
        return swaps.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AdminSwapResponseDTO> getPendingAdminSwaps() {
        log.info("Admin fetching pending swap requests (waiting for manager)");
        List<SwapRequest> swaps = swapRequestRepository.findPendingForManagerWithUsers();
        return swaps.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AdminSwapResponseDTO getSwapById(String swapId) {
        log.info("Admin fetching swap request by ID: {}", swapId);
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));
        return convertToDTO(swap);
    }

    @Transactional
    public AdminSwapResponseDTO approveSwap(String swapId, String adminEmail, SwapActionRequest request) {
        log.info("Admin {} approving swap: {}", adminEmail, swapId);

        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Set manager status to APPROVED
        swap.setManagerStatus("APPROVED");
        swap.setApprovedBy(admin.getId().toString());
        swap.setApprovedAt(LocalDateTime.now());
        swap.setManagerComments(request.getManagerComments());
        swap.setUpdatedAt(LocalDateTime.now());

        SwapRequest updated = swapRequestRepository.save(swap);
        log.info("Swap request approved by admin: {}", swapId);

        return convertToDTO(updated);
    }

    @Transactional
    public AdminSwapResponseDTO rejectSwap(String swapId, String adminEmail, SwapActionRequest request) {
        log.info("Admin {} rejecting swap: {}", adminEmail, swapId);

        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        // Set manager status to REJECTED
        swap.setManagerStatus("REJECTED");
        swap.setApprovedBy(adminEmail);
        swap.setManagerComments(request.getManagerComments());
        swap.setUpdatedAt(LocalDateTime.now());

        SwapRequest updated = swapRequestRepository.save(swap);
        log.info("Swap request rejected by admin: {}", swapId);

        return convertToDTO(updated);
    }

    @Transactional
    public void deleteAllSwapRequests() {
        log.info("Admin deleting all swap requests");
        swapRequestRepository.deleteAll();
        log.info("All swap requests deleted");
    }

    @Transactional
    public void deleteSwapRequest(String swapId) {
        log.info("Admin deleting swap request: {}", swapId);
        swapRequestRepository.deleteById(swapId);
        log.info("Swap request deleted: {}", swapId);
    }

    public long getPendingAdminCount() {
        return swapRequestRepository.findPendingForManagerWithUsers().size();
    }

    private AdminSwapResponseDTO convertToDTO(SwapRequest swap) {
        String approvedByName = null;
        if (swap.getApprovedBy() != null) {
            try {
                User approver = userRepository.findById(String.valueOf(UUID.fromString(swap.getApprovedBy())))
                        .orElse(null);
                if (approver != null) {
                    approvedByName = approver.getFullName();
                }
            } catch (IllegalArgumentException e) {
                // Invalid UUID
            }
        }

        // Determine overall status for display
        String overallStatus = getOverallStatus(swap);

        return AdminSwapResponseDTO.builder()
                .id(swap.getId())
                .requesterId(swap.getRequester().getId().toString())
                .requesterName(swap.getRequester().getFullName())
                .requesterEmail(swap.getRequester().getEmail())
                .targetId(swap.getTargetEmployee().getId().toString())
                .targetName(swap.getTargetEmployee().getFullName())
                .targetEmail(swap.getTargetEmployee().getEmail())
                .requesterShiftDate(swap.getRequesterShiftDate())
                .targetShiftDate(swap.getTargetShiftDate())
                .requesterShiftTime(swap.getRequesterShiftTime())
                .targetShiftTime(swap.getTargetShiftTime())
                .reason(swap.getReason())
                .requesterStatus(swap.getRequesterStatus())
                .targetStatus(swap.getTargetStatus())
                .managerStatus(swap.getManagerStatus())
                .overallStatus(overallStatus)
                .approvedBy(swap.getApprovedBy())
                .approvedByName(approvedByName)
                .managerComments(swap.getManagerComments())
                .createdAt(swap.getCreatedAt())
                .updatedAt(swap.getUpdatedAt())
                .build();
    }

    private String getOverallStatus(SwapRequest swap) {
        // If manager approved, overall is APPROVED
        if ("APPROVED".equals(swap.getManagerStatus())) {
            return "APPROVED";
        }
        // If manager rejected, overall is REJECTED
        if ("REJECTED".equals(swap.getManagerStatus())) {
            return "REJECTED";
        }
        // If both requester and target accepted, waiting for manager
        if ("ACCEPTED".equals(swap.getRequesterStatus()) && "ACCEPTED".equals(swap.getTargetStatus())) {
            return "PENDING_ADMIN";
        }
        // If requester rejected
        if ("REJECTED".equals(swap.getRequesterStatus())) {
            return "REJECTED_BY_REQUESTER";
        }
        // If target rejected
        if ("REJECTED".equals(swap.getTargetStatus())) {
            return "REJECTED_BY_TARGET";
        }
        // If target pending
        if ("PENDING".equals(swap.getTargetStatus())) {
            return "PENDING_TARGET";
        }
        // Default
        return "PENDING";
    }
}