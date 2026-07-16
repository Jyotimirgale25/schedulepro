package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, String> {

    // ✅ Check if user has read announcement
    Optional<AnnouncementRead> findByAnnouncementIdAndUserId(String announcementId, String userId);

    // ✅ Get all announcements read by user
    List<AnnouncementRead> findByUserId(String userId);

    // ✅ Get all reads for an announcement
    List<AnnouncementRead> findByAnnouncementId(String announcementId);

    // ✅ Delete all reads for an announcement
    void deleteByAnnouncementId(String announcementId);

    // ✅ Count reads for an announcement
    long countByAnnouncementId(String announcementId);
}