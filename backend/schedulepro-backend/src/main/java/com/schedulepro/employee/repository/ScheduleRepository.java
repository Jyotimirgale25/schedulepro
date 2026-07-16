package com.schedulepro.employee.repository;

import com.schedulepro.employee.entity.Schedule;
import com.schedulepro.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {

    // ===== EMPLOYEE METHODS =====
    List<Schedule> findByEmployeeOrderByDateAsc(User employee);
    List<Schedule> findByEmployeeAndDateBetweenOrderByDateAsc(User employee, LocalDate start, LocalDate end);

    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT s FROM Schedule s WHERE s.employee = :employee AND s.date >= CURRENT_DATE ORDER BY s.date ASC")
    List<Schedule> findUpcomingByEmployee(@Param("employee") User employee);

    // ===== MANAGER METHODS =====
    @Query("SELECT s FROM Schedule s WHERE s.employee.id IN :employeeIds")
    List<Schedule> findByEmployeeIdIn(@Param("employeeIds") List<String> employeeIds);

    // ===== ADMIN METHODS =====
    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT s FROM Schedule s ORDER BY s.date ASC")
    List<Schedule> findAllOrderByDateAsc();

    // ❌ REMOVE these duplicate methods (replace with findByDate and findByDateBetween below)
    // List<Schedule> findByScheduleDate(LocalDate date);
    // List<Schedule> findByScheduleDateBetween(LocalDate startDate, LocalDate endDate);
    // long countByScheduleDate(LocalDate date);

    // ✅ Use these instead (with 'date' field)
    List<Schedule> findByDate(LocalDate date);
    List<Schedule> findByDateBetween(LocalDate startDate, LocalDate endDate);
    long countByDate(LocalDate date);

    List<Schedule> findByEmployeeId(String employeeId);
    List<Schedule> findByStatus(String status);

    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT s FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate ORDER BY s.date ASC")
    List<Schedule> findSchedulesInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT s FROM Schedule s WHERE s.employee.id = :employeeId AND s.date = :date")
    List<Schedule> findByEmployeeAndDate(@Param("employeeId") String employeeId, @Param("date") LocalDate date);

    List<Schedule> findByCreatedBy(String createdBy);

    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate")
    long countSchedulesInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // ✅ FIX: Change scheduleDate to date
    @Query("SELECT s FROM Schedule s WHERE s.date = CURRENT_DATE")
    List<Schedule> findTodaysSchedules();

    @Query("SELECT s FROM Schedule s WHERE LOWER(s.employeeName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Schedule> findByEmployeeNameContainingIgnoreCase(@Param("name") String name);



    @Query("SELECT s FROM Schedule s WHERE s.employee = :employee AND s.date = :date")
    List<Schedule> findByEmployeeAndDate(@Param("employee") User employee, @Param("date") LocalDate date);

    @Query("SELECT COUNT(s) FROM Schedule s WHERE s.date BETWEEN :startDate AND :endDate")
    long countByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}