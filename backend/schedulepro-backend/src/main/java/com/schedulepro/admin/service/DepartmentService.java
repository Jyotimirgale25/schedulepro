// src/main/java/com/schedulepro/admin/service/DepartmentService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.CreateDepartmentRequest;
import com.schedulepro.admin.dto.request.UpdateDepartmentRequest;
import com.schedulepro.admin.dto.response.DepartmentDTO;
import com.schedulepro.admin.entity.Department;
import com.schedulepro.admin.repository.DepartmentRepository;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.BadRequestException;
import com.schedulepro.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    // ============================================
    // GET ALL DEPARTMENTS
    // ============================================
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        log.info("📋 Fetching all departments");
        List<Department> departments = departmentRepository.findAll();
        return departments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET ACTIVE DEPARTMENTS
    // ============================================
    @Transactional(readOnly = true)
    public List<DepartmentDTO> getActiveDepartments() {
        log.info("📋 Fetching active departments");
        List<Department> departments = departmentRepository.findAllActive();
        return departments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET DEPARTMENT BY ID
    // ============================================
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentById(String id) {
        log.info("📋 Fetching department by ID: {}", id);
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
        return convertToDTO(department);
    }

    // ============================================
    // GET DEPARTMENT BY NAME
    // ============================================
    @Transactional(readOnly = true)
    public DepartmentDTO getDepartmentByName(String name) {
        log.info("📋 Fetching department by name: {}", name);
        Department department = departmentRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with name: " + name));
        return convertToDTO(department);
    }

    // ============================================
    // CREATE DEPARTMENT
    // ============================================
    @Transactional
    public DepartmentDTO createDepartment(CreateDepartmentRequest request) {
        log.info("📝 Creating new department: {}", request.getName());

        if (departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Department with name '" + request.getName() + "' already exists");
        }

        Department department = Department.builder()
                .name(request.getName())
                .description(request.getDescription())
                .head(request.getHead())
                .employeeCount(0)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Department savedDepartment = departmentRepository.save(department);
        log.info("✅ Department created successfully: {}", savedDepartment.getName());

        // ✅ Update employee count after create
        updateEmployeeCount(savedDepartment.getName());

        return convertToDTO(savedDepartment);
    }

    // ============================================
    // UPDATE DEPARTMENT
    // ============================================
    @Transactional
    public DepartmentDTO updateDepartment(String id, UpdateDepartmentRequest request) {
        log.info("📝 Updating department: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        String oldName = department.getName();
        String newName = request.getName();

        // Check if name is being changed
        if (newName != null && !newName.equals(oldName)) {
            if (departmentRepository.existsByName(newName)) {
                throw new BadRequestException("Department with name '" + newName + "' already exists");
            }
            department.setName(newName);

            // ✅ Update employee counts for both old and new names
            updateEmployeeCount(oldName);
            updateEmployeeCount(newName);
        }

        if (request.getDescription() != null) {
            department.setDescription(request.getDescription());
        }

        if (request.getHead() != null) {
            department.setHead(request.getHead());
        }

        if (request.getIsActive() != null) {
            department.setIsActive(request.getIsActive());
        }

        department.setUpdatedAt(LocalDateTime.now());

        Department updatedDepartment = departmentRepository.save(department);

        // ✅ Recalculate employee count after update
        updateEmployeeCount(department.getName());

        log.info("✅ Department updated successfully: {}", updatedDepartment.getName());

        return convertToDTO(updatedDepartment);
    }

    // ============================================
    // DELETE DEPARTMENT
    // ============================================
    @Transactional
    public void deleteDepartment(String id) {
        log.info("🗑️ Deleting department: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        String departmentName = department.getName();

        // Check if there are users in this department
        long userCount = userRepository.countByDepartment(departmentName);
        if (userCount > 0) {
            throw new BadRequestException("Cannot delete department with " + userCount +
                    " employees. Reassign employees first.");
        }

        departmentRepository.delete(department);
        log.info("✅ Department deleted successfully: {}", departmentName);
    }

    // ============================================
    // TOGGLE DEPARTMENT STATUS
    // ============================================
    @Transactional
    public DepartmentDTO toggleDepartmentStatus(String id) {
        log.info("🔄 Toggling department status: {}", id);

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        department.setIsActive(!department.getIsActive());
        department.setUpdatedAt(LocalDateTime.now());

        Department updatedDepartment = departmentRepository.save(department);
        log.info("✅ Department status toggled: {} is now {}",
                updatedDepartment.getName(),
                updatedDepartment.getIsActive() ? "ACTIVE" : "INACTIVE");

        return convertToDTO(updatedDepartment);
    }

    // ============================================
    // UPDATE EMPLOYEE COUNT - ✅ SINGLE METHOD
    // ============================================


    @Transactional
    public void updateEmployeeCount(String departmentName) {
        if (departmentName == null || departmentName.isEmpty()) {
            return;
        }

        log.info("📊 Updating employee count for department: {}", departmentName);

        Department department = departmentRepository.findByName(departmentName)
                .orElse(null);

        if (department != null) {
            // ✅ Count ONLY active users in this department
            long count = userRepository.countByDepartment(departmentName);
            department.setEmployeeCount((int) count);
            department.setUpdatedAt(LocalDateTime.now());
            departmentRepository.save(department);
            log.info("✅ Updated employee count for {}: {}", departmentName, count);
        } else {
            log.warn("⚠️ Department not found: {}", departmentName);
        }
    }

    // ============================================
    // REFRESH ALL DEPARTMENT COUNTS
    // ============================================
    @Transactional
    public void refreshAllDepartmentCounts() {
        log.info("🔄 Refreshing all department employee counts");

        List<Department> departments = departmentRepository.findAll();
        for (Department dept : departments) {
            long count = userRepository.countByDepartment(dept.getName());
            dept.setEmployeeCount((int) count);
            dept.setUpdatedAt(LocalDateTime.now());
            departmentRepository.save(dept);
            log.info("📊 Updated {}: {} employees", dept.getName(), count);
        }

        log.info("✅ All department counts refreshed");
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================
    private DepartmentDTO convertToDTO(Department department) {
        return DepartmentDTO.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .head(department.getHead())
                .employeeCount(department.getEmployeeCount())
                .isActive(department.getIsActive())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}