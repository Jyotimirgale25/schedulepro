// src/main/java/com/schedulepro/employee/repository/ProjectRepository.java
package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    // ===== FIND BY CREATED BY =====
    List<Project> findByCreatedBy(String createdBy);
    List<Project> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    // ===== FIND BY CREATOR AND STATUS =====
    List<Project> findByCreatedByAndStatus(String createdBy, String status);
    List<Project> findByCreatedByAndStatusOrderByCreatedAtDesc(String createdBy, String status);

    // ===== FIND BY CREATOR ID =====
    @Query("SELECT p FROM Project p WHERE p.createdBy = :creatorId ORDER BY p.createdAt DESC")
    List<Project> findProjectsByCreator(@Param("creatorId") String creatorId);

    // ===== FIND BY MANAGER ID =====
    List<Project> findByManagerId(String managerId);
    List<Project> findByManagerIdOrderByCreatedAtDesc(String managerId);

    // ===== FIND BY STATUS =====
    List<Project> findByStatus(String status);
    List<Project> findByStatusOrderByCreatedAtDesc(String status);

    // ===== FIND PROJECTS FOR EMPLOYEE =====
    @Query("SELECT DISTINCT p FROM Project p JOIN p.tasks t WHERE t.assignedTo.id = :userId")
    List<Project> findProjectsByAssignedUser(@Param("userId") String userId);

    // ===== COUNT METHODS =====
    long countByCreatedBy(String createdBy);
    long countByManagerId(String managerId);
    long countByStatus(String status);

    // ===== FIND ALL ORDERED =====
    List<Project> findAllByOrderByCreatedAtDesc();
}