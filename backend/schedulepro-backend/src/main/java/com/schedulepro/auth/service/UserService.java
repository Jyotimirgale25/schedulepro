// src/main/java/com/schedulepro/auth/service/UserService.java
package com.schedulepro.auth.service;

import com.schedulepro.admin.service.DepartmentService;  // ✅ ADD THIS IMPORT
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.ResourceNotFoundException;  // ✅ ADD THIS IMPORT
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentService departmentService;  // ✅ ADD THIS

    // ===== GET CURRENT USER =====
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }

        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    // ===== GET USER BY ID =====
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // ===== GET USER BY EMAIL =====
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    // ===== GET USER BY USERNAME =====
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    // ===== GET ALL USERS =====
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ===== GET ALL EMPLOYEES =====
    public List<User> getAllEmployees() {
        return userRepository.findByRole("EMPLOYEE");
    }

    // ===== GET ALL MANAGERS =====
    public List<User> getAllManagers() {
        return userRepository.findByRole("MANAGER");
    }

    // ===== GET ALL ADMINS =====
    public List<User> getAllAdmins() {
        return userRepository.findByRole("ADMIN");
    }

    // ===== GET ACTIVE USERS =====
    public List<User> getActiveUsers() {
        return userRepository.findByIsActive(true);
    }

    // ===== GET INACTIVE USERS =====
    public List<User> getInactiveUsers() {
        return userRepository.findByIsActive(false);
    }

    // ===== UPDATE PROFILE =====
    @Transactional
    public User updateProfile(String email, String fullName, String phone, String department, String position) {
        User user = getUserByEmail(email);

        if (fullName != null) user.setFullName(fullName);
        if (phone != null) user.setPhone(phone);

        // ✅ Update department with count update
        if (department != null) {
            String oldDepartment = user.getDepartment();
            user.setDepartment(department);

            // Update department counts
            if (oldDepartment != null && !oldDepartment.isEmpty()) {
                departmentService.updateEmployeeCount(oldDepartment);
            }
            if (department != null && !department.isEmpty()) {
                departmentService.updateEmployeeCount(department);
            }
        }

        if (position != null) user.setPosition(position);

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    // ===== CHANGE PASSWORD =====
    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = getUserByEmail(email);

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password
        if (newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password changed for user: {}", email);
    }

    // ===== RESET PASSWORD (Admin only) =====
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = getUserByEmail(email);

        if (newPassword.length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("Password reset for user: {}", email);
    }

    // ===== ACTIVATE USER =====
    @Transactional
    public void activateUser(String email) {
        User user = getUserByEmail(email);
        user.setIsActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("User activated: {}", email);
    }

    // ===== DEACTIVATE USER =====
    @Transactional
    public void deactivateUser(String email) {
        User user = getUserByEmail(email);
        user.setIsActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("User deactivated: {}", email);
    }

    // ===== UPDATE ROLE =====
    @Transactional
    public void updateUserRole(String email, String newRole) {
        User user = getUserByEmail(email);
        user.setRole(newRole);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("Role updated for {}: {}", email, newRole);
    }

    // ===== CHECK IF USER EXISTS =====
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    // ===== GET USER WITH DETAILS =====
    public User getUserWithDetails(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ===== GET CURRENT USER DETAILS =====
    public UserDetails getCurrentUserDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return (UserDetails) authentication.getPrincipal();
    }

    // ===== CHECK IF CURRENT USER HAS ROLE =====
    public boolean hasRole(String role) {
        User user = getCurrentUser();
        return user.getRole().equalsIgnoreCase(role);
    }

    // ===== COUNT USERS =====
    public long countAllUsers() {
        return userRepository.count();
    }

    public long countActiveUsers() {
        return userRepository.countByIsActive(true);
    }

    public long countByRole(String role) {
        return userRepository.countByRole(role);
    }

    // ===== SEARCH USERS =====
    public List<User> searchUsers(String keyword) {
        return userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(
                keyword, keyword, keyword);
    }

    // ===== UPDATE PROFILE PHOTO =====
    @Transactional
    public User updateProfilePhoto(String email, String photoUrl) {
        User user = getUserByEmail(email);
        user.setProfilePhoto(photoUrl);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    // ===== GET USERS BY DEPARTMENT =====
    public List<User> getUsersByDepartment(String department) {
        return userRepository.findByDepartment(department);
    }

    // ===== GET TEAM MEMBERS =====
    public List<User> getTeamMembers(String managerId) {
        return userRepository.findByManagerId(managerId);
    }

    // ===== GET MANAGER =====
    public User getManager(String employeeId) {
        User employee = getUserById(employeeId);
        if (employee.getManagerId() == null) {
            return null;
        }
        return getUserById(employee.getManagerId());
    }

    // ===== UPDATE USER DEPARTMENT =====
    @Transactional
    public User updateUserDepartment(String userId, String newDepartment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String oldDepartment = user.getDepartment();
        user.setDepartment(newDepartment);
        User updatedUser = userRepository.save(user);

        // Update department counts
        if (oldDepartment != null && !oldDepartment.isEmpty()) {
            departmentService.updateEmployeeCount(oldDepartment);
        }
        if (newDepartment != null && !newDepartment.isEmpty()) {
            departmentService.updateEmployeeCount(newDepartment);
        }

        return updatedUser;
    }

    // ===== GET USERS BY DEPARTMENT NAME =====
    public List<User> findUsersByDepartment(String department) {
        return userRepository.findByDepartment(department);
    }

    // ===== COUNT USERS BY DEPARTMENT =====
    public long countUsersByDepartment(String department) {
        return userRepository.countByDepartment(department);
    }
}