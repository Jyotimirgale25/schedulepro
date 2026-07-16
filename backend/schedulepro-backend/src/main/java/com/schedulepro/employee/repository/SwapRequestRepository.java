package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.SwapRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SwapRequestRepository extends JpaRepository<SwapRequest, String> {

    // ✅ Find by requester with eager loading
    @Query("SELECT s FROM SwapRequest s " +
            "JOIN FETCH s.requester " +
            "JOIN FETCH s.targetEmployee " +
            "WHERE s.requester.id = :requesterId")
    List<SwapRequest> findByRequesterIdWithUsers(@Param("requesterId") String requesterId);

    // ✅ Find by target employee with eager loading
    @Query("SELECT s FROM SwapRequest s " +
            "JOIN FETCH s.requester " +
            "JOIN FETCH s.targetEmployee " +
            "WHERE s.targetEmployee.id = :targetEmployeeId")
    List<SwapRequest> findByTargetEmployeeIdWithUsers(@Param("targetEmployeeId") String targetEmployeeId);

    // ✅ Find pending swaps for manager with eager loading
    @Query("SELECT s FROM SwapRequest s " +
            "JOIN FETCH s.requester " +
            "JOIN FETCH s.targetEmployee " +
            "WHERE s.managerStatus = 'PENDING'")
    List<SwapRequest> findPendingForManagerWithUsers();

    // ✅ Find by manager status
    List<SwapRequest> findByManagerStatus(String managerStatus);

    long countByManagerStatus(String pending);
}