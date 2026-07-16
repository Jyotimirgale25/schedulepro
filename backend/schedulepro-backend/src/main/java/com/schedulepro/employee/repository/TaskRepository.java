// src/main/java/com/schedulepro/employee/repository/TaskRepository.java
package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Task;
import com.schedulepro.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    List<Task> findByAssignedTo(User assignedTo);

    List<Task> findByAssignedToAndStatus(User assignedTo, String status);



    @Modifying
    @Query("DELETE FROM Task t WHERE t.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") String projectId);

    List<Task> findByProjectId(String projectId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId")
    long countByProjectId(@Param("projectId") String projectId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") String projectId, @Param("status") String status);

    long countByStatus(String status);
    // ✅ This method exists - use this
    List<Task> findByProjectIdIn(List<String> projectIds);

    // ✅ If you want to use @Query (optional)
    @Query("SELECT t FROM Task t WHERE t.project.id IN :projectIds")
    List<Task> findTasksByProjectIds(@Param("projectIds") List<String> projectIds);

    List<Task> findByProjectIdAndAssignedTo(String projectId, User assignedTo);

    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.assignedTo = :assignedTo")
    List<Task> findByProjectIdAndAssignedToId(@Param("projectId") String projectId, @Param("assignedTo") User assignedTo);

    List<Task> findByAssignedToIdInAndStatus(@Param("userIds") List<String> userIds, @Param("status") String status);

    List<Task> findByProjectIdAndStatus(String projectId, String status);

    List<Task> findByAssignedToAndProjectId(User assignedTo, String projectId);

    List<Task> findByAssignedToIdIn(List<String> userIds);
}