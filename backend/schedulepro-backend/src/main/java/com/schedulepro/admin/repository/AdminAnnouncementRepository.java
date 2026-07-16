package com.schedulepro.admin.repository;

import com.schedulepro.employee.entity.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdminAnnouncementRepository extends JpaRepository<Announcement, String> {

    // ✅ Active announcements
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();

    // ✅ Get by priority (not type)
    List<Announcement> findByPriority(String priority);

    // ✅ Active announcements (no validFrom/validTo)
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true ORDER BY a.createdAt DESC")
    List<Announcement> findActiveAnnouncements();

    // ✅ Active announcements by priority
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND a.priority = :priority ORDER BY a.createdAt DESC")
    List<Announcement> findActiveAnnouncementsByPriority(@Param("priority") String priority);

    // ✅ Paginated all announcements
    Page<Announcement> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ✅ Count active
    long countByIsActiveTrue();

    // ✅ Count active announcements
    @Query("SELECT COUNT(a) FROM Announcement a WHERE a.isActive = true")
    long countActiveAnnouncements();

    // ✅ Get by creator
    List<Announcement> findByCreatedByOrderByCreatedAtDesc(String userId);

    // ✅ Get announcements with expires_at check
    @Query("SELECT a FROM Announcement a WHERE a.isActive = true AND (a.expiresAt IS NULL OR a.expiresAt > :now) ORDER BY a.createdAt DESC")
    List<Announcement> findActiveAnnouncementsWithExpiry(@Param("now") LocalDateTime now);
}