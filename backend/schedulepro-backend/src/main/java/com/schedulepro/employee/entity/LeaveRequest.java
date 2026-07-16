package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests")
@Data
@EntityListeners(AuditingEntityListener.class)
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "leave_type", nullable = false)
    private String leaveType;  // CASUAL, SICK, ANNUAL, EMERGENCY

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    private String reason;

    @Column(nullable = false)
    private String status = "PENDING";  // PENDING, APPROVED, REJECTED

    @Column(name = "total_days")
    private Double totalDays;

    @Column(name = "approved_by")
    private String approvedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "approval_comments")
    private String approvalComments;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}