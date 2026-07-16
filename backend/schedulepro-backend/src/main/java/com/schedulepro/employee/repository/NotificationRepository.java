// src/main/java/com/schedulepro/employee/repository/NotificationRepository.java
package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import com.schedulepro.employee.entity.NotificationType;
import java.time.LocalDateTime;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {  // ✅ Changed to String

    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);  // ✅ Changed to String

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);  // ✅ Changed to String

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);  // ✅ Changed to String
    // In NotificationRepository.java
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type);
    Page<Notification> findByUserId(String userId, Pageable pageable);
    List<Notification> findByUserIdAndTypeAndIsReadFalse(String userId, String type);
    List<Notification> findByUserIdAndEntityTypeAndIsReadFalse(String userId, String entityType);
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false")
    long countUnreadByUserId(@Param("userId") String userId);  // ✅ Changed to String

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.id = :notificationId AND n.user.id = :userId")
    void markAsReadByUserId(@Param("notificationId") String notificationId, @Param("userId") String userId);  // ✅ Changed to String

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.user.id = :userId")
    void markAllAsReadByUserId(@Param("userId") String userId);  // ✅ Changed to String

    @Modifying
    @Transactional
    void deleteByUserId(String userId);  // ✅ Changed to String

    // ===== NEW METHODS FOR ADMIN =====

    // Get notifications by date range
    @Query("SELECT n FROM Notification n WHERE n.createdAt BETWEEN :start AND :end ORDER BY n.createdAt DESC")
    List<Notification> findByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Get top users with most notifications
    @Query(value = "SELECT n.user_id, COUNT(*) as count FROM notifications n GROUP BY n.user_id ORDER BY count DESC LIMIT :limit", nativeQuery = true)
    List<Object[]> findTopUsersWithNotifications(@Param("limit") int limit);

    // Get notification type distribution
    @Query("SELECT n.type, COUNT(n) FROM Notification n GROUP BY n.type")
    List<Object[]> findNotificationTypeDistribution();

    // Delete notifications older than date
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteByCreatedAtBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Search by title and type
    Page<Notification> findByTitleContainingIgnoreCaseAndType(String keyword, NotificationType type, Pageable pageable);

    // Search by title or message
    @Query("SELECT n FROM Notification n WHERE LOWER(n.title) LIKE LOWER(CONCAT('%', :titleKeyword, '%')) OR LOWER(n.message) LIKE LOWER(CONCAT('%', :messageKeyword, '%'))")
    Page<Notification> findByTitleContainingIgnoreCaseOrMessageContainingIgnoreCase(
            @Param("titleKeyword") String titleKeyword,
            @Param("messageKeyword") String messageKeyword,
            Pageable pageable);

    // Search by type
    Page<Notification> findByType(NotificationType type, Pageable pageable);
}