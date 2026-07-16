// src/main/java/com/schedulepro/employee/repository/LeaveRequestRepository.java
package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, String> {

    // ============ USER/EMPLOYEE METHODS ============

    // Find all leave requests for a specific user, ordered by creation date (newest first)
    List<LeaveRequest> findByUserOrderByCreatedAtDesc(User user);

    // Find all leave requests for a specific user with pagination
    Page<LeaveRequest> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // Find leave requests by user ID
    List<LeaveRequest> findByUserId(String userId);

    // Find leave requests by user ID and status
    List<LeaveRequest> findByUserIdAndStatus(String userId, String status);

    // Find leave requests by user ID with pagination
    Page<LeaveRequest> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Count leave requests by user and status
    long countByUserIdAndStatus(String userId, String status);

    // ============ STATUS METHODS ============

    // Find all leave requests by status
    List<LeaveRequest> findByStatus(String status);

    // Count leave requests by status
    long countByStatus(String status);

    // Find pending leave requests
    @Query("SELECT l FROM LeaveRequest l WHERE l.status = 'PENDING' ORDER BY l.createdAt ASC")
    List<LeaveRequest> findPendingRequests();

    // ============ MANAGER METHODS ============

    // Find all leave requests for users under a specific manager
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.managerId = :managerId")
    List<LeaveRequest> findByManagerId(@Param("managerId") String managerId);

    // Find leave requests by manager and status
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.managerId = :managerId AND l.status = :status")
    List<LeaveRequest> findByManagerIdAndStatus(@Param("managerId") String managerId, @Param("status") String status);

    // Find leave requests by manager with pagination
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.managerId = :managerId ORDER BY l.createdAt DESC")
    Page<LeaveRequest> findByManagerIdWithPagination(@Param("managerId") String managerId, Pageable pageable);

    // ============ DATE RANGE METHODS ============

    // Find leave requests within a date range
    @Query("SELECT l FROM LeaveRequest l WHERE l.startDate <= :endDate AND l.endDate >= :startDate")
    List<LeaveRequest> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Find leave requests for a user within a date range
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.id = :userId AND l.startDate <= :endDate AND l.endDate >= :startDate")
    List<LeaveRequest> findByUserIdAndDateRange(@Param("userId") String userId,
                                                @Param("startDate") LocalDate startDate,
                                                @Param("endDate") LocalDate endDate);

    // ============ ADMIN METHODS ============

    // Delete all leave requests
    @Modifying
    @Query("DELETE FROM LeaveRequest l")
    void deleteAllLeaveRequests();

    // Find all leave requests with pagination
    Page<LeaveRequest> findAll(Pageable pageable);

    // Find leave requests by multiple user IDs and status
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.id IN :userIds AND l.status = :status")
    List<LeaveRequest> findByUserIdInAndStatus(@Param("userIds") List<String> userIds, @Param("status") String status);

    // Find leave requests by multiple user IDs
    @Query("SELECT l FROM LeaveRequest l WHERE l.user.id IN :userIds")
    List<LeaveRequest> findByUserIdIn(@Param("userIds") List<String> userIds);

    // ============ LEAVE BALANCE METHODS ============

    // Get total approved leave days for a user
    @Query("SELECT SUM(l.totalDays) FROM LeaveRequest l WHERE l.user.id = :userId AND l.status = 'APPROVED'")
    Double getTotalApprovedLeaveDays(@Param("userId") String userId);

    // Get total approved leave days by type for a user
    @Query("SELECT SUM(l.totalDays) FROM LeaveRequest l WHERE l.user.id = :userId AND l.status = 'APPROVED' AND l.leaveType = :leaveType")
    Double getTotalApprovedLeaveDaysByType(@Param("userId") String userId, @Param("leaveType") String leaveType);

    // ============ BULK OPERATIONS ============

    // Delete all leave requests for a specific user
    @Modifying
    @Query("DELETE FROM LeaveRequest l WHERE l.user.id = :userId")
    void deleteByUserId(@Param("userId") String userId);

    // Update status for multiple leave requests
    @Modifying
    @Query("UPDATE LeaveRequest l SET l.status = :status WHERE l.id IN :ids")
    void updateStatusForIds(@Param("status") String status, @Param("ids") List<String> ids);
}