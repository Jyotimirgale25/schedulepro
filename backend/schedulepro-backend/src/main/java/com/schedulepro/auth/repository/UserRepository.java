// src/main/java/com/schedulepro/auth/repository/UserRepository.java
package com.schedulepro.auth.repository;

import com.schedulepro.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // ===== BASIC FIND METHODS =====
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    List<User> findByManagerId(String managerId);

    Optional<User> findByIdAndManagerId(String id, String managerId);

    // ===== ADMIN-SPECIFIC METHODS =====
    List<User> findByRole(String role);

    List<User> findByDepartment(String department);

    List<User> findByIsActive(Boolean isActive);




    // ===== COUNT METHODS =====
    long countByRole(String role);

    long countByIsActive(Boolean isActive);

    @Query("SELECT COUNT(u) FROM User u WHERE u.department = :departmentName AND u.isActive = true")
    long countByDepartment(@Param("departmentName") String departmentName);

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = true")
    long countActiveUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.isActive = false")
    long countInactiveUsers();

    // ===== FIND ACTIVE USERS =====
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.isActive = true")
    List<User> findActiveUsersByRole(@Param("role") String role);

    @Query("SELECT u FROM User u WHERE u.department = :department AND u.isActive = true")
    List<User> findActiveUsersByDepartment(@Param("department") String department);

    // ===== EXISTENCE CHECKS =====
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    // ===== SEARCH METHODS =====
    // ✅ Method 1: JPA Method Naming (Spring Data JPA will generate query)
    List<User> findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(
            String email, String fullName, String username);

    // ✅ Method 2: Custom @Query (Recommended - better control)
    @Query("SELECT u FROM User u WHERE " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<User> searchUsers(@Param("keyword") String keyword);

    // ✅ Method 3: Search with multiple filters
    @Query("SELECT u FROM User u WHERE " +
            "(:keyword IS NULL OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:role IS NULL OR u.role = :role) " +
            "AND (:department IS NULL OR u.department = :department) " +
            "AND (:isActive IS NULL OR u.isActive = :isActive)")
    List<User> searchUsersWithFilters(
            @Param("keyword") String keyword,
            @Param("role") String role,
            @Param("department") String department,
            @Param("isActive") Boolean isActive);
}