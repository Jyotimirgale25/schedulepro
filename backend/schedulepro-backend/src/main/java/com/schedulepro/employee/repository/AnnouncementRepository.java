package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, String> {

    // ✅ Get all active announcements
    List<Announcement> findByIsActiveTrueOrderByCreatedAtDesc();

    // ✅ Get all announcements (admin)
    List<Announcement> findAllByOrderByCreatedAtDesc();

    // ✅ Get active announcements by priority
    List<Announcement> findByIsActiveTrueAndPriorityOrderByCreatedAtDesc(String priority);

    // ✅ Get active announcements not expired
    List<Announcement> findByIsActiveTrueAndExpiresAtAfterOrderByCreatedAtDesc(LocalDateTime now);

    // ✅ Count active announcements
    long countByIsActiveTrue();

    // ✅ Get announcements by creator
    List<Announcement> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    List<Announcement> findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(String id);

    // ❌ REMOVE THIS METHOD (it's looking for "type")
    // List<Announcement> findActiveAnnouncementsByType(String type, LocalDateTime now);

    // ✅ REMOVE OR COMMENT OUT any method using "type"
}