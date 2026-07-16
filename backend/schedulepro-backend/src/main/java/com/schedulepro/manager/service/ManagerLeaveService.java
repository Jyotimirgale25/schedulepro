// src/main/java/com/schedulepro/manager/service/ManagerLeaveService.java
package com.schedulepro.manager.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import com.schedulepro.employee.service.NotificationHelper;  // ✅ Import NotificationHelper
import com.schedulepro.manager.dto.request.LeaveApprovalRequest;
import com.schedulepro.manager.dto.response.LeaveRequestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagerLeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;
    private final NotificationHelper notificationHelper;  // ✅ Already injected

    // ============================================
    // GET PENDING LEAVES
    // ============================================
    public List<LeaveRequestDTO> getPendingLeavesForManager(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> teamMembers = userRepository.findByManagerId(manager.getId());
        List<String> teamMemberIds = teamMembers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        if (teamMemberIds.isEmpty()) {
            return List.of();
        }

        List<LeaveRequest> pendingLeaves = leaveRequestRepository
                .findByUserIdInAndStatus(teamMemberIds, "PENDING");

        return pendingLeaves.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // APPROVE LEAVE
    // ============================================
    @Transactional
    public LeaveRequestDTO approveLeave(String leaveId, String managerEmail, LeaveApprovalRequest request) {
        log.info("📋 Manager {} approving leave: {}", managerEmail, leaveId);

        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        User employee = leaveRequest.getUser();

        // ✅ Verify manager is authorized
        if (employee.getManagerId() == null || !employee.getManagerId().equals(manager.getId())) {
            throw new RuntimeException("You are not authorized to approve this leave request");
        }

        // Update leave status
        leaveRequest.setStatus("APPROVED");
        leaveRequest.setApprovedBy(manager.getFullName());
        leaveRequest.setApprovalComments(request.getRemarks());
        leaveRequest.setUpdatedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("✅ Leave approved by {} for employee {}", manager.getFullName(), employee.getFullName());

        // ✅ SEND NOTIFICATION TO EMPLOYEE
        notificationHelper.notifyLeaveApproved(
                employee.getId(),           // Receiver: Employee
                manager.getId(),            // Sender: Manager
                manager.getFullName(),      // Sender Name
                leaveRequest.getLeaveType(),
                leaveRequest.getStartDate().toString()
        );

        return convertToDTO(saved);
    }

    // ============================================
    // REJECT LEAVE
    // ============================================
    @Transactional
    public LeaveRequestDTO rejectLeave(String leaveId, String managerEmail, LeaveApprovalRequest request) {
        log.info("📋 Manager {} rejecting leave: {}", managerEmail, leaveId);

        LeaveRequest leaveRequest = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave request not found"));

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        User employee = leaveRequest.getUser();

        // ✅ Verify manager is authorized
        if (employee.getManagerId() == null || !employee.getManagerId().equals(manager.getId())) {
            throw new RuntimeException("You are not authorized to reject this leave request");
        }

        // Update leave status
        leaveRequest.setStatus("REJECTED");
        leaveRequest.setApprovedBy(manager.getFullName());
        leaveRequest.setApprovalComments(request.getRemarks());
        leaveRequest.setUpdatedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        log.info("❌ Leave rejected by {} for employee {}", manager.getFullName(), employee.getFullName());

        // ✅ SEND NOTIFICATION TO EMPLOYEE
        notificationHelper.notifyLeaveRejected(
                employee.getId(),           // Receiver: Employee
                manager.getId(),            // Sender: Manager
                manager.getFullName(),      // Sender Name
                leaveRequest.getLeaveType(),
                leaveRequest.getStartDate().toString(),
                request.getRemarks() != null ? request.getRemarks() : "No reason provided"
        );

        return convertToDTO(saved);
    }

    // ============================================
    // CONVERT TO DTO
    // ============================================
    private LeaveRequestDTO convertToDTO(LeaveRequest leave) {
        User employee = leave.getUser();

        return LeaveRequestDTO.builder()
                .id(leave.getId())
                .userFullName(employee != null ? employee.getFullName() : "Unknown")
                .userEmail(employee != null ? employee.getEmail() : "Unknown")
                .userId(employee != null ? employee.getId() : null)
                .leaveType(leave.getLeaveType())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .totalDays(leave.getTotalDays())
                .status(leave.getStatus())
                .build();
    }
}