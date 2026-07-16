// src/main/java/com/schedulepro/employee/entity/Project.java
package com.schedulepro.employee.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "start_date")
    private LocalDateTime startDate;  // ✅ Use LocalDateTime

    @Column(name = "end_date")
    private LocalDateTime endDate;    // ✅ Use LocalDateTime

    private String priority; // LOW, MEDIUM, HIGH, URGENT

    private String status = "PLANNED";

    private Integer progress = 0;  // ✅ Add this field

    @Column(name = "created_by")
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;  // ✅ Use LocalDateTime

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;  // ✅ Use LocalDateTime

    @Column(name = "manager_id")
    private String managerId;
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Task> tasks = new HashSet<>();
}