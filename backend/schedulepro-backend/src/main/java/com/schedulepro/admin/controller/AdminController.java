// src/main/java/com/schedulepro/admin/controller/AdminController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.CreateUserRequest;
import com.schedulepro.admin.dto.request.UpdateUserRequest;
import com.schedulepro.admin.dto.request.UpdateUserRoleRequest;
import com.schedulepro.admin.dto.response.AdminStatsDTO;
import com.schedulepro.admin.dto.response.AdminUserDTO;
import com.schedulepro.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDTO>> getAllUsers() {
        log.info("GET /api/admin/users - Fetching all users");
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<AdminUserDTO> getUserById(@PathVariable String id) {
        log.info("GET /api/admin/users/{} - Fetching user", id);
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PostMapping("/users")
    public ResponseEntity<AdminUserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("POST /api/admin/users - Creating new user");
        AdminUserDTO createdUser = adminService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<AdminUserDTO> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        log.info("PUT /api/admin/users/{} - Updating user", id);
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDTO> updateUserRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        log.info("PUT /api/admin/users/{}/role - Updating user role", id);
        return ResponseEntity.ok(adminService.updateUserRole(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        log.info("DELETE /api/admin/users/{} - Deleting user", id);
        adminService.deleteUser(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<AdminUserDTO> toggleUserStatus(@PathVariable String id) {
        log.info("PUT /api/admin/users/{}/toggle-status - Toggling user status", id);
        return ResponseEntity.ok(adminService.toggleUserStatus(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getAdminStats() {
        log.info("GET /api/admin/stats - Fetching admin stats");
        return ResponseEntity.ok(adminService.getAdminStats());
    }
}