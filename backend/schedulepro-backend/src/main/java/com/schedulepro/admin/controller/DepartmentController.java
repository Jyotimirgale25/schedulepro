// src/main/java/com/schedulepro/admin/controller/DepartmentController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.CreateDepartmentRequest;
import com.schedulepro.admin.dto.request.UpdateDepartmentRequest;
import com.schedulepro.admin.dto.response.DepartmentDTO;
import com.schedulepro.admin.service.DepartmentService;
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
@RequestMapping("/api/admin/departments")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class DepartmentController {

    private final DepartmentService departmentService;

    // ============================================
    // GET ALL DEPARTMENTS
    // ============================================
    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        log.info("GET /api/admin/departments - Fetching all departments");
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }

    // ============================================
    // GET ACTIVE DEPARTMENTS
    // ============================================
    @GetMapping("/active")
    public ResponseEntity<List<DepartmentDTO>> getActiveDepartments() {
        log.info("GET /api/admin/departments/active - Fetching active departments");
        return ResponseEntity.ok(departmentService.getActiveDepartments());
    }

    // ============================================
    // GET DEPARTMENT BY ID
    // ============================================
    @GetMapping("/{id}")
    public ResponseEntity<DepartmentDTO> getDepartmentById(@PathVariable String id) {
        log.info("GET /api/admin/departments/{} - Fetching department", id);
        return ResponseEntity.ok(departmentService.getDepartmentById(id));
    }

    // ============================================
    // GET DEPARTMENT BY NAME
    // ============================================
    @GetMapping("/name/{name}")
    public ResponseEntity<DepartmentDTO> getDepartmentByName(@PathVariable String name) {
        log.info("GET /api/admin/departments/name/{} - Fetching department by name", name);
        return ResponseEntity.ok(departmentService.getDepartmentByName(name));
    }

    // ============================================
    // CREATE DEPARTMENT
    // ============================================
    @PostMapping
    public ResponseEntity<DepartmentDTO> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        log.info("POST /api/admin/departments - Creating new department");
        DepartmentDTO createdDepartment = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdDepartment);
    }

    // ============================================
    // UPDATE DEPARTMENT
    // ============================================
    @PutMapping("/{id}")
    public ResponseEntity<DepartmentDTO> updateDepartment(
            @PathVariable String id,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        log.info("PUT /api/admin/departments/{} - Updating department", id);
        log.info("📝 Update data: {}", request);
        DepartmentDTO updatedDepartment = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(updatedDepartment);
    }

    // ============================================
    // DELETE DEPARTMENT
    // ============================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDepartment(@PathVariable String id) {
        log.info("DELETE /api/admin/departments/{} - Deleting department", id);
        departmentService.deleteDepartment(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Department deleted successfully");
        return ResponseEntity.ok(response);
    }

    // ============================================
    // TOGGLE DEPARTMENT STATUS
    // ============================================
    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<DepartmentDTO> toggleDepartmentStatus(@PathVariable String id) {
        log.info("PUT /api/admin/departments/{}/toggle-status - Toggling department status", id);
        return ResponseEntity.ok(departmentService.toggleDepartmentStatus(id));
    }
}