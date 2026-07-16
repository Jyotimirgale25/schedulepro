// src/main/java/com/schedulepro/employee/repository/PhotoHistoryRepository.java
package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.PhotoHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PhotoHistoryRepository extends JpaRepository<PhotoHistory, String> {

    // Use String for userId since User.id is String
    List<PhotoHistory> findByUserIdOrderByTimestampDesc(String userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PhotoHistory p WHERE p.user.id = :userId")
    void deleteByUserId(@Param("userId") String userId);

    @Query("SELECT COUNT(p) FROM PhotoHistory p WHERE p.user.id = :userId")
    long countByUserId(@Param("userId") String userId);
}