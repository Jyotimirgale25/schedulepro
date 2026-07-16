package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.LeaveBalance;
import com.schedulepro.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, String> {
    Optional<LeaveBalance> findByUser(User user);
}