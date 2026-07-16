package com.schedulepro.employee.service;

import com.schedulepro.employee.dto.request.SwapRequestDTO;
import com.schedulepro.employee.dto.response.SwapResponseDTO;
import com.schedulepro.employee.entity.SwapRequest;
import com.schedulepro.employee.repository.SwapRequestRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeSwapService {

    private final SwapRequestRepository swapRequestRepository;
    private final UserRepository userRepository;

    // ✅ FIXED: Get my swap requests with eager loading
    public List<SwapResponseDTO> getMySwapRequests(String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Use JOIN FETCH to load user data eagerly
        List<SwapRequest> swaps = swapRequestRepository
                .findByRequesterIdWithUsers(requester.getId());

        return swaps.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ FIXED: Get incoming swap requests with eager loading
    public List<SwapResponseDTO> getIncomingSwapRequests(String email) {
        User targetEmployee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<SwapRequest> swaps = swapRequestRepository
                .findByTargetEmployeeIdWithUsers(targetEmployee.getId());

        return swaps.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ FIXED: Create swap request
    @Transactional
    public SwapResponseDTO createSwapRequest(String email, SwapRequestDTO request) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        User targetEmployee = userRepository.findById(request.getTargetEmployeeId())
                .orElseThrow(() -> new RuntimeException("Target employee not found"));

        SwapRequest swapRequest = new SwapRequest();
        swapRequest.setId(UUID.randomUUID().toString());
        swapRequest.setRequester(requester);
        swapRequest.setTargetEmployee(targetEmployee);
        swapRequest.setRequesterShiftDate(LocalDate.parse(request.getRequesterShiftDate()));
        swapRequest.setTargetShiftDate(LocalDate.parse(request.getTargetShiftDate()));
        swapRequest.setReason(request.getReason());
        swapRequest.setRequesterStatus("PENDING");
        swapRequest.setTargetStatus("PENDING");
        swapRequest.setManagerStatus("PENDING");
        swapRequest.setCreatedAt(LocalDateTime.now());

        SwapRequest saved = swapRequestRepository.save(swapRequest);
        return convertToDTO(saved);
    }

    // ✅ FIXED: Accept incoming swap
    @Transactional
    public SwapResponseDTO acceptIncomingSwap(String email, String swapId) {
        User targetEmployee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        if (!swap.getTargetEmployee().getId().equals(targetEmployee.getId())) {
            throw new RuntimeException("You are not the target of this swap request");
        }

        if (!"PENDING".equals(swap.getTargetStatus())) {
            throw new RuntimeException("This swap request has already been responded to");
        }

        swap.setTargetStatus("ACCEPTED");
        swap.setUpdatedAt(LocalDateTime.now());

        // If both requester and target accepted, send to manager
        if ("ACCEPTED".equals(swap.getRequesterStatus()) && "ACCEPTED".equals(swap.getTargetStatus())) {
            swap.setManagerStatus("PENDING");
        }

        SwapRequest saved = swapRequestRepository.save(swap);
        return convertToDTO(saved);
    }

    // ✅ FIXED: Reject incoming swap
    @Transactional
    public SwapResponseDTO rejectIncomingSwap(String email, String swapId) {
        User targetEmployee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        if (!swap.getTargetEmployee().getId().equals(targetEmployee.getId())) {
            throw new RuntimeException("You are not the target of this swap request");
        }

        if (!"PENDING".equals(swap.getTargetStatus())) {
            throw new RuntimeException("This swap request has already been responded to");
        }

        swap.setTargetStatus("REJECTED");
        swap.setUpdatedAt(LocalDateTime.now());
        SwapRequest saved = swapRequestRepository.save(swap);
        return convertToDTO(saved);
    }

    // ✅ FIXED: Convert to DTO with all user data loaded
    private SwapResponseDTO convertToDTO(SwapRequest swap) {
        return SwapResponseDTO.builder()
                .id(swap.getId())
                .requesterId(swap.getRequester().getId())
                .requesterName(swap.getRequester().getFullName())
                .requesterEmail(swap.getRequester().getEmail())
                .targetEmployeeId(swap.getTargetEmployee().getId())
                .targetName(swap.getTargetEmployee().getFullName())
                .targetEmail(swap.getTargetEmployee().getEmail())
                .requesterShiftDate(swap.getRequesterShiftDate().toString())
                .targetShiftDate(swap.getTargetShiftDate().toString())
                .reason(swap.getReason())
                .requesterStatus(swap.getRequesterStatus())
                .targetStatus(swap.getTargetStatus())
                .managerStatus(swap.getManagerStatus())
                .createdAt(swap.getCreatedAt())
                .build();
    }
}