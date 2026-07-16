package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, String> {

    // Find pending invitations for an employee email
    List<Invitation> findByEmployeeEmailAndStatus(String employeeEmail, String status);

    // Find all invitations sent by a manager
    List<Invitation> findByManagerIdAndStatus(String managerId, String status);

    // Find invitations by status list (HISTORY)
    List<Invitation> findByEmployeeEmailAndStatusInOrderByUpdatedAtDesc(String employeeEmail, List<String> statuses);

    // Find all invitations for an employee ordered by created date
    List<Invitation> findByEmployeeEmailOrderByCreatedAtDesc(String employeeEmail);

    // Find invitation by ID and employee email (for acceptance)
    Optional<Invitation> findByIdAndEmployeeEmail(String id, String employeeEmail);

    // ✅ FIXED: Find invitations by status list ordered by respondedAt DESC
    @Query("SELECT i FROM Invitation i WHERE i.employeeEmail = :email AND i.status IN :statuses ORDER BY i.respondedAt DESC")
    List<Invitation> findByEmployeeEmailAndStatusInOrderByRespondedAtDesc(
            @Param("email") String email,
            @Param("statuses") List<String> statuses);  // ← FIXED: closing parenthesis

    // Find pending invitations for employee (not expired)
    @Query("SELECT i FROM Invitation i WHERE i.employeeEmail = :email AND i.status = 'PENDING' AND (i.expiresAt IS NULL OR i.expiresAt > CURRENT_TIMESTAMP)")
    List<Invitation> findPendingInvitationsByEmployeeEmail(@Param("email") String email);

    // Count pending invitations for a manager
    long countByManagerIdAndStatus(String managerId, String status);
}