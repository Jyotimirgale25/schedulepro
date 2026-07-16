package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.EmployeeDetails;
import com.schedulepro.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeDetailsRepository extends JpaRepository<EmployeeDetails, String> {

    // Find employee details by user
    Optional<EmployeeDetails> findByUser(User user);
    Optional<EmployeeDetails> findByUserId(String userId);
    // Find employee details by user email
    Optional<EmployeeDetails> findByUserEmail(String email);

    // Find employee details by employee ID
    Optional<EmployeeDetails> findByEmployeeId(String employeeId);

    // Check if employee details exist for a user
    boolean existsByUser(User user);

    // Check if employee ID already exists
    boolean existsByEmployeeId(String employeeId);
}