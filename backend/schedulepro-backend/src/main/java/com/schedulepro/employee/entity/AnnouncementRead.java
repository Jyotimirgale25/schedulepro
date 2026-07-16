package com.schedulepro.employee.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcement_reads")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRead {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "announcement_id", nullable = false)
    private String announcementId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "read_at")
    private LocalDateTime readAt;
}