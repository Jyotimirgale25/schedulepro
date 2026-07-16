// src/main/java/com/schedulepro/admin/repository/DepartmentRepository.java
package com.schedulepro.admin.repository;

import com.schedulepro.admin.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {

    Optional<Department> findByName(String name);

    List<Department> findByIsActive(Boolean isActive);

    @Query("SELECT d FROM Department d WHERE d.isActive = true")
    List<Department> findAllActive();

    @Query("SELECT COUNT(u) FROM User u WHERE u.department = :departmentName AND u.isActive = true")
    long countEmployeesByDepartment(@Param("departmentName") String departmentName);

    boolean existsByName(String name);
}