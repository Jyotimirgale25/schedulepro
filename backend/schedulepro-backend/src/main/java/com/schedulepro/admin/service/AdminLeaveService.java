// src/main/java/com/schedulepro/admin/service/AdminLeaveService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.LeaveActionRequest;
import com.schedulepro.admin.dto.response.AdminLeaveResponseDTO;
import com.schedulepro.admin.dto.response.LeaveStatsDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminLeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    public List<AdminLeaveResponseDTO> getAllLeaveRequests() {
        log.info("Admin fetching all leave requests");
        return leaveRequestRepository.findAll().stream()
                .map(this::convertToAdminResponseDTO)
                .collect(Collectors.toList());
    }

    public List<AdminLeaveResponseDTO> getPendingLeaveRequests() {
        log.info("Admin fetching pending leave requests");
        return leaveRequestRepository.findByStatus("PENDING").stream()
                .map(this::convertToAdminResponseDTO)
                .collect(Collectors.toList());
    }

    public AdminLeaveResponseDTO getLeaveById(String leaveId) {
        log.info("Admin fetching leave request by ID: {}", leaveId);
        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));
        return convertToAdminResponseDTO(leave);
    }

    @Transactional
    public AdminLeaveResponseDTO approveLeave(String leaveId, String adminEmail, LeaveActionRequest request) {
        log.info("Admin {} approving leave: {}", adminEmail, leaveId);

        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        leave.setStatus("APPROVED");
        leave.setApprovedBy(admin.getId().toString()); // Store as String UUID
        leave.setApprovalComments(request.getApprovalComments());
        leave.setUpdatedAt(LocalDateTime.now());

        if (leave.getTotalDays() == null) {
            long days = ChronoUnit.DAYS.between(leave.getStartDate(), leave.getEndDate()) + 1;
            leave.setTotalDays((double) days);
        }

        LeaveRequest updated = leaveRequestRepository.save(leave);
        log.info("Leave request approved: {}", leaveId);

        return convertToAdminResponseDTO(updated);
    }

    @Transactional
    public AdminLeaveResponseDTO rejectLeave(String leaveId, String adminEmail, LeaveActionRequest request) {
        log.info("Admin {} rejecting leave: {}", adminEmail, leaveId);

        LeaveRequest leave = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        leave.setStatus("REJECTED");
        leave.setApprovedBy(adminEmail); // Store as email string
        leave.setApprovalComments(request.getApprovalComments());
        leave.setUpdatedAt(LocalDateTime.now());

        LeaveRequest updated = leaveRequestRepository.save(leave);
        log.info("Leave request rejected: {}", leaveId);

        return convertToAdminResponseDTO(updated);
    }

    @Transactional
    public void deleteAllLeaveRequests() {
        log.info("Admin deleting all leave requests");
        leaveRequestRepository.deleteAllLeaveRequests();
        log.info("All leave requests deleted");
    }

    @Transactional
    public void deleteLeaveRequest(String leaveId) {
        log.info("Admin deleting leave request: {}", leaveId);
        leaveRequestRepository.deleteById(leaveId);
        log.info("Leave request deleted: {}", leaveId);
    }

    public LeaveStatsDTO getLeaveStats() {
        log.info("Admin fetching leave statistics");

        long totalRequests = leaveRequestRepository.count();
        long pendingRequests = leaveRequestRepository.countByStatus("PENDING");
        long approvedRequests = leaveRequestRepository.countByStatus("APPROVED");
        long rejectedRequests = leaveRequestRepository.countByStatus("REJECTED");

        return LeaveStatsDTO.builder()
                .totalRequests(totalRequests)
                .pendingRequests(pendingRequests)
                .approvedRequests(approvedRequests)
                .rejectedRequests(rejectedRequests)
                .build();
    }

    private AdminLeaveResponseDTO convertToAdminResponseDTO(LeaveRequest leave) {
        String approvedByName = null;
        String approvedByEmail = null;

        if (leave.getApprovedBy() != null && !leave.getApprovedBy().isEmpty()) {
            String approvedBy = leave.getApprovedBy();

            // Try to find user by ID (UUID format)
            try {
                UUID approverId = UUID.fromString(approvedBy);
                Optional<User> approver = userRepository.findById(String.valueOf(approverId));
                if (approver.isPresent()) {
                    approvedByName = approver.get().getFullName();
                    approvedByEmail = approver.get().getEmail();
                }
            } catch (IllegalArgumentException e) {
                // Not a valid UUID, might be email or other string
                approvedByName = approvedBy; // Use as is
                approvedByEmail = approvedBy;
            }
        }

        return AdminLeaveResponseDTO.builder()
                .id(leave.getId())
                .userId(leave.getUser().getId().toString())
                .userFullName(leave.getUser().getFullName())
                .userEmail(leave.getUser().getEmail())
                .userDepartment(leave.getUser().getDepartment())
                .userPosition(leave.getUser().getPosition())
                .leaveType(leave.getLeaveType())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .totalDays(leave.getTotalDays())
                .approvedBy(leave.getApprovedBy())
                .approvedByName(approvedByName)
                .approvedByEmail(approvedByEmail)
                .approvalComments(leave.getApprovalComments())
                .createdAt(leave.getCreatedAt())
                .updatedAt(leave.getUpdatedAt())
                .build();
    }
}