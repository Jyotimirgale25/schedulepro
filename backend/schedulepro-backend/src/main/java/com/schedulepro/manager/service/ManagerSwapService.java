package com.schedulepro.manager.service;

import com.schedulepro.employee.entity.SwapRequest;
import com.schedulepro.employee.repository.SwapRequestRepository;
import com.schedulepro.employee.dto.response.SwapResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerSwapService {

    private final SwapRequestRepository swapRequestRepository;

    // ✅ FIXED: Get pending swaps with eager loading
    public List<SwapResponseDTO> getPendingSwaps(String managerEmail) {
        // ✅ Use JOIN FETCH to load user data
        List<SwapRequest> swaps = swapRequestRepository.findPendingForManagerWithUsers();

        return swaps.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SwapResponseDTO approveSwap(String managerEmail, String swapId, String comments) {
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        if (!"PENDING".equals(swap.getManagerStatus())) {
            throw new RuntimeException("This swap request is not pending manager approval");
        }

        swap.setManagerStatus("APPROVED");
        swap.setManagerComments(comments);
        swap.setUpdatedAt(LocalDateTime.now());
        SwapRequest saved = swapRequestRepository.save(swap);
        return convertToDTO(saved);
    }

    @Transactional
    public SwapResponseDTO rejectSwap(String managerEmail, String swapId, String comments) {
        SwapRequest swap = swapRequestRepository.findById(swapId)
                .orElseThrow(() -> new RuntimeException("Swap request not found"));

        if (!"PENDING".equals(swap.getManagerStatus())) {
            throw new RuntimeException("This swap request is not pending manager approval");
        }

        swap.setManagerStatus("REJECTED");
        swap.setManagerComments(comments);
        swap.setUpdatedAt(LocalDateTime.now());
        SwapRequest saved = swapRequestRepository.save(swap);
        return convertToDTO(saved);
    }

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
                .managerComments(swap.getManagerComments())
                .createdAt(swap.getCreatedAt())
                .build();
    }
}