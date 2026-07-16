// src/main/java/com/schedulepro/employee/entity/PhotoHistory.java
package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "photo_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "photo", columnDefinition = "TEXT")
    private String photo;

    @Column(name = "type")
    private String type; // UPLOADED, CAPTURED, REVERTED, PREVIOUS

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}