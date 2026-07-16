package com.schedulepro.employee.service;

import com.schedulepro.employee.dto.request.LeaveRequestDTO;
import com.schedulepro.employee.dto.response.LeaveBalanceResponseDTO;
import com.schedulepro.employee.dto.response.LeaveResponseDTO;
import com.schedulepro.employee.entity.LeaveBalance;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.repository.LeaveBalanceRepository;
import com.schedulepro.employee.repository.LeaveRequestRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeLeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final UserRepository userRepository;

    @Transactional
    public LeaveResponseDTO createLeaveRequest(String email, LeaveRequestDTO request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Calculate total days
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;
        double totalDays = days;

        // Create leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setUser(user);
        leaveRequest.setLeaveType(request.getLeaveType());
        leaveRequest.setStartDate(request.getStartDate());
        leaveRequest.setEndDate(request.getEndDate());
        leaveRequest.setReason(request.getReason());
        leaveRequest.setStatus("PENDING");
        leaveRequest.setTotalDays(totalDays);

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);

        return LeaveResponseDTO.builder()
                .id(saved.getId())
                .leaveType(saved.getLeaveType())
                .startDate(saved.getStartDate())
                .endDate(saved.getEndDate())
                .reason(saved.getReason())
                .status(saved.getStatus())
                .totalDays(saved.getTotalDays())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    public List<LeaveResponseDTO> getUserLeaves(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return leaveRequestRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public LeaveBalanceResponseDTO getLeaveBalance(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LeaveBalance balance = leaveBalanceRepository.findByUser(user)
                .orElseGet(() -> createDefaultBalance(user));

        return LeaveBalanceResponseDTO.builder()
                .casualLeaves(balance.getCasualLeaves())
                .sickLeaves(balance.getSickLeaves())
                .annualLeaves(balance.getAnnualLeaves())
                .emergencyLeaves(balance.getEmergencyLeaves())
                .build();
    }

    private LeaveResponseDTO convertToDTO(LeaveRequest leave) {
        return LeaveResponseDTO.builder()
                .id(leave.getId())
                .leaveType(leave.getLeaveType())
                .startDate(leave.getStartDate())
                .endDate(leave.getEndDate())
                .reason(leave.getReason())
                .status(leave.getStatus())
                .totalDays(leave.getTotalDays())
                .createdAt(leave.getCreatedAt())
                .approvedBy(leave.getApprovedBy())
                .build();
    }

    private LeaveBalance createDefaultBalance(User user) {
        LeaveBalance balance = new LeaveBalance();
        balance.setUser(user);
        balance.setCasualLeaves(12);
        balance.setSickLeaves(10);
        balance.setAnnualLeaves(15);
        balance.setEmergencyLeaves(3);
        return leaveBalanceRepository.save(balance);
    }
}