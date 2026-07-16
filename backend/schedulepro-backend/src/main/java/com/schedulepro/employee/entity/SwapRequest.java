// src/main/java/com/schedulepro/employee/entity/SwapRequest.java
package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "swap_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_employee_id", nullable = false)
    private User targetEmployee;

    @Column(name = "requester_shift_date", nullable = false)
    private LocalDate requesterShiftDate;

    @Column(name = "target_shift_date", nullable = false)
    private LocalDate targetShiftDate;

    @Column(name = "requester_shift_time")
    private String requesterShiftTime;

    @Column(name = "target_shift_time")
    private String targetShiftTime;

    @Column(name = "requester_schedule_id")
    private String requesterScheduleId;

    @Column(name = "target_schedule_id")
    private String targetScheduleId;

    @Column(name = "reason")
    private String reason;

    @Column(name = "requester_status", nullable = false)
    private String requesterStatus = "PENDING";

    @Column(name = "target_status", nullable = false)
    private String targetStatus = "PENDING";

    @Column(name = "manager_status", nullable = false)
    private String managerStatus = "PENDING";

    @Column(name = "manager_comments")
    private String managerComments;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;



    public boolean isFullyAccepted() {
        return "ACCEPTED".equals(requesterStatus) && "ACCEPTED".equals(targetStatus);
    }

    public boolean isPendingManager() {
        return isFullyAccepted() && "PENDING".equals(managerStatus);
    }
}