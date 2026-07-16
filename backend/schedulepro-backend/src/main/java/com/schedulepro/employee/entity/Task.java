// src/main/java/com/schedulepro/employee/entity/Task.java
package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "assigned_by")  // ✅ ADD THIS - Who assigned the task
    private String assignedBy;

    @Column(name = "priority")
    private String priority; // HIGH, MEDIUM, LOW

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "status")
    private String status; // PENDING, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED

    @Column(name = "progress")
    private Integer progress = 0;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "completed_at")  // ✅ ADD THIS - When task was completed
    private LocalDateTime completedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "rejection_note")
    private String rejectionNote;

    @Column(name = "resubmission_note")
    private String resubmissionNote;

    @Column(name = "feedback")
    private String feedback;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}