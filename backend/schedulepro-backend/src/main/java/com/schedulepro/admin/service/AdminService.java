// src/main/java/com/schedulepro/admin/service/AdminService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.CreateUserRequest;
import com.schedulepro.admin.dto.request.UpdateUserRequest;
import com.schedulepro.admin.dto.request.UpdateUserRoleRequest;
import com.schedulepro.admin.dto.response.AdminStatsDTO;
import com.schedulepro.admin.dto.response.AdminUserDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.BadRequestException;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.service.NotificationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationHelper notificationHelper;
    private final DepartmentService departmentService;  // ✅ ADD THIS

    // ============================================
    // GET ALL USERS
    // ============================================
    @Transactional(readOnly = true)
    public List<AdminUserDTO> getAllUsers() {
        log.info("📋 Admin fetching all users");
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET USER BY ID
    // ============================================
    @Transactional(readOnly = true)
    public AdminUserDTO getUserById(String userId) {
        log.info("📋 Admin fetching user by ID: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return convertToDTO(user);
    }

    // ============================================
    // CREATE USER - ✅ FIXED
    // ============================================
    @Transactional
    public AdminUserDTO createUser(CreateUserRequest request) {
        log.info("📝 Admin creating new user: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BadRequestException("User with email " + request.getEmail() + " already exists");
        }

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new BadRequestException("User with username " + request.getUsername() + " already exists");
        }

        User admin = getCurrentUser();
        String department = request.getDepartment();  // ✅ Save department

        User newUser = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole() != null ? request.getRole() : "EMPLOYEE")
                .phone(request.getPhone())
                .department(department)
                .position(request.getPosition())
                .managerId(request.getManagerId())
                .isActive(true)
                .isVerified(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .employeeId(generateEmployeeId(request.getRole()))
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("✅ User created successfully: {}", savedUser.getEmail());

        // ✅ UPDATE DEPARTMENT COUNT
        if (department != null && !department.isEmpty()) {
            departmentService.updateEmployeeCount(department);
            log.info("📊 Updated employee count for department: {}", department);
        }

        if (admin != null) {
            notificationHelper.createNotification(
                    savedUser.getId(),
                    admin.getId(),
                    admin.getFullName(),
                    "Welcome to Schedule Pro 🎉",
                    String.format("Your account has been created by %s. Welcome aboard!", admin.getFullName()),
                    "SUCCESS",
                    "USER"
            );
        }

        return convertToDTO(savedUser);
    }

    // ============================================
    // UPDATE USER - ✅ FIXED
    // ============================================
    @Transactional
    public AdminUserDTO updateUser(String userId, UpdateUserRequest request) {
        log.info("📝 Admin updating user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        User admin = getCurrentUser();

        // ✅ Save old department before update
        String oldDepartment = user.getDepartment();

        // Update basic info
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getEmail() != null) {
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(userId)) {
                            throw new BadRequestException("Email " + request.getEmail() + " is already taken");
                        }
                    });
            user.setEmail(request.getEmail());

        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        // ✅ Update department
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        if (request.getPosition() != null) {
            user.setPosition(request.getPosition());
        }

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        // ✅ Update role if changed
        if (request.getRole() != null && !request.getRole().equals(user.getRole())) {
            if (admin.getId().equals(userId)) {
                throw new BadRequestException("You cannot change your own role");
            }
            String oldRole = user.getRole();
            user.setRole(request.getRole());
            log.info("🔄 User role changed from {} to {}", oldRole, request.getRole());
        }

        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        log.info("✅ User updated successfully: {}", updatedUser.getEmail());

        // ✅ UPDATE DEPARTMENT COUNTS FOR BOTH OLD AND NEW DEPARTMENTS
        if (oldDepartment != null && !oldDepartment.isEmpty()) {
            departmentService.updateEmployeeCount(oldDepartment);
            log.info("📊 Updated employee count for old department: {}", oldDepartment);
        }

        String newDepartment = user.getDepartment();
        if (newDepartment != null && !newDepartment.isEmpty() && !newDepartment.equals(oldDepartment)) {
            departmentService.updateEmployeeCount(newDepartment);
            log.info("📊 Updated employee count for new department: {}", newDepartment);
        }

        if (admin != null) {
            notificationHelper.createNotification(
                    updatedUser.getId(),
                    admin.getId(),
                    admin.getFullName(),
                    "Profile Updated 📝",
                    String.format("Your profile has been updated by %s.", admin.getFullName()),
                    "INFO",
                    "USER"
            );
        }

        return convertToDTO(updatedUser);
    }

    // ============================================
    // UPDATE USER ROLE
    // ============================================
    @Transactional
    public AdminUserDTO updateUserRole(String userId, UpdateUserRoleRequest request) {
        log.info("🔄 Admin updating role for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String oldRole = user.getRole();
        String newRole = request.getRole();

        User admin = getCurrentUser();
        if (admin.getId().equals(userId)) {
            throw new BadRequestException("You cannot change your own role");
        }

        user.setRole(newRole);
        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        log.info("✅ User role updated: {} -> {}", oldRole, newRole);

        notificationHelper.createNotification(
                updatedUser.getId(),
                admin.getId(),
                admin.getFullName(),
                "Role Changed 🔄",
                String.format("Your role has been changed from %s to %s by %s.",
                        oldRole, newRole, admin.getFullName()),
                "INFO",
                "USER"
        );

        return convertToDTO(updatedUser);
    }

    // ============================================
    // DELETE USER - ✅ FIXED
    // ============================================
    @Transactional
    public void deleteUser(String userId) {
        log.info("🗑️ Admin deleting user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // ✅ Save department before deleting
        String department = user.getDepartment();

        User admin = getCurrentUser();
        if (admin.getId().equals(userId)) {
            throw new BadRequestException("You cannot delete your own account");
        }

        userRepository.delete(user);
        log.info("✅ User deleted successfully: {}", user.getEmail());

        // ✅ UPDATE DEPARTMENT COUNT
        if (department != null && !department.isEmpty()) {
            departmentService.updateEmployeeCount(department);
            log.info("📊 Updated employee count for department: {}", department);
        }
    }

    // ============================================
    // TOGGLE USER STATUS - ✅ FIXED
    // ============================================
    @Transactional
    public AdminUserDTO toggleUserStatus(String userId) {
        log.info("🔄 Admin toggling status for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        User admin = getCurrentUser();
        if (admin.getId().equals(userId)) {
            throw new BadRequestException("You cannot change your own status");
        }

        // ✅ Save department before status change
        String department = user.getDepartment();

        user.setIsActive(!user.getIsActive());
        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        String status = user.getIsActive() ? "activated" : "deactivated";
        log.info("✅ User {}: {}", status, updatedUser.getEmail());

        // ✅ UPDATE DEPARTMENT COUNT (active/inactive affects count)
        if (department != null && !department.isEmpty()) {
            departmentService.updateEmployeeCount(department);
            log.info("📊 Updated employee count for department: {}", department);
        }

        notificationHelper.createNotification(
                updatedUser.getId(),
                admin.getId(),
                admin.getFullName(),
                user.getIsActive() ? "Account Activated ✅" : "Account Deactivated ⛔",
                String.format("Your account has been %s by %s.", status, admin.getFullName()),
                user.getIsActive() ? "SUCCESS" : "WARNING",
                "USER"
        );

        return convertToDTO(updatedUser);
    }

    // ============================================
    // GET ADMIN STATS
    // ============================================
    @Transactional(readOnly = true)
    public AdminStatsDTO getAdminStats() {
        log.info("📊 Admin fetching system stats");

        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.countByRole("ADMIN");
        long totalManagers = userRepository.countByRole("MANAGER");
        long totalEmployees = userRepository.countByRole("EMPLOYEE");
        long activeUsers = userRepository.countActiveUsers();
        long inactiveUsers = userRepository.countInactiveUsers();

        return AdminStatsDTO.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .totalAdmins(totalAdmins)
                .totalManagers(totalManagers)
                .totalEmployees(totalEmployees)
                .build();
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================
    private AdminUserDTO convertToDTO(User user) {
        return AdminUserDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .username(user.getUsername())
                .phone(user.getPhone())
                .role(user.getRole())
                .department(user.getDepartment())
                .position(user.getPosition())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .profilePhoto(user.getProfilePhoto())
                .managerId(user.getManagerId())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElse(null);
    }
    // ============================================
// GENERATE EMPLOYEE ID BASED ON ROLE
// ============================================
    private String generateEmployeeId(String role) {
        String prefix = "EMP-";
        if ("ADMIN".equalsIgnoreCase(role)) {
            prefix = "ADMIN-";
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            prefix = "MGR-";
        }
        return prefix + System.currentTimeMillis();
    }
}