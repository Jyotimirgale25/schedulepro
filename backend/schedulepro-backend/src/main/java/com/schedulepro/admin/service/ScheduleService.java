// src/main/java/com/schedulepro/admin/service/ScheduleService.java
package com.schedulepro.admin.service;

import com.schedulepro.admin.dto.request.CreateScheduleRequest;
import com.schedulepro.admin.dto.request.UpdateScheduleRequest;
import com.schedulepro.admin.dto.response.ScheduleDTO;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.common.exception.BadRequestException;
import com.schedulepro.common.exception.ResourceNotFoundException;
import com.schedulepro.employee.entity.Schedule;
import com.schedulepro.employee.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    // ============================================
    // GET ALL SCHEDULES
    // ============================================
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getAllSchedules() {
        log.info("📋 Fetching all schedules");
        List<Schedule> schedules = scheduleRepository.findAll();
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET SCHEDULE BY ID
    // ============================================
    @Transactional(readOnly = true)
    public ScheduleDTO getScheduleById(String id) {
        log.info("📋 Fetching schedule by ID: {}", id);
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));
        return convertToDTO(schedule);
    }

    // ============================================
    // GET SCHEDULES BY DATE
    // ============================================
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getSchedulesByDate(String dateStr) {
        log.info("📋 Fetching schedules by date: {}", dateStr);
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        List<Schedule> schedules = scheduleRepository.findByDate(date);
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET SCHEDULES BY DATE RANGE
    // ============================================
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getSchedulesByDateRange(String startDateStr, String endDateStr) {
        log.info("📋 Fetching schedules between {} and {}", startDateStr, endDateStr);
        LocalDate startDate = LocalDate.parse(startDateStr, DATE_FORMATTER);
        LocalDate endDate = LocalDate.parse(endDateStr, DATE_FORMATTER);
        List<Schedule> schedules = scheduleRepository.findByDateBetween(startDate, endDate);
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // GET SCHEDULES BY EMPLOYEE
    // ============================================
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getSchedulesByEmployee(String employeeId) {
        log.info("📋 Fetching schedules for employee: {}", employeeId);
        List<Schedule> schedules = scheduleRepository.findByEmployeeId(employeeId);
        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ============================================
    // CREATE SCHEDULE
    // ============================================
    @Transactional
    public ScheduleDTO createSchedule(CreateScheduleRequest request) {
        log.info("📝 Creating new schedule for employee: {}", request.getEmployeeId());

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        LocalDate scheduleDate = LocalDate.parse(request.getDate(), DATE_FORMATTER);

        // Check if schedule already exists
        List<Schedule> existingSchedules = scheduleRepository.findByEmployeeAndDate(employee, scheduleDate);
        if (!existingSchedules.isEmpty()) {
            throw new BadRequestException("Schedule already exists for this employee on " + request.getDate());
        }

        User admin = getCurrentUser();

        // ✅ CREATE SCHEDULE - No updatedAt field
        Schedule schedule = new Schedule();
        schedule.setEmployee(employee);
        schedule.setEmployeeName(employee.getFullName());
        schedule.setEmployeeEmail(employee.getEmail());
        schedule.setDate(scheduleDate);
        schedule.setShift(request.getShift());
        schedule.setStatus("SCHEDULED");
        schedule.setCreatedBy(admin != null ? admin.getId() : null);
        schedule.setCreatedAt(LocalDateTime.now());
        // ❌ REMOVED: schedule.setUpdatedAt(LocalDateTime.now());

        Schedule savedSchedule = scheduleRepository.save(schedule);
        log.info("✅ Schedule created successfully for employee: {}", employee.getFullName());

        return convertToDTO(savedSchedule);
    }

    // ============================================
    // UPDATE SCHEDULE
    // ============================================
    @Transactional
    public ScheduleDTO updateSchedule(String id, UpdateScheduleRequest request) {
        log.info("📝 Updating schedule: {}", id);

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        if (request.getEmployeeId() != null && !request.getEmployeeId().equals(schedule.getEmployee().getId())) {
            User employee = userRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
            schedule.setEmployee(employee);
            schedule.setEmployeeName(employee.getFullName());
            schedule.setEmployeeEmail(employee.getEmail());
        }

        if (request.getDate() != null) {
            schedule.setDate(LocalDate.parse(request.getDate(), DATE_FORMATTER));
        }

        if (request.getShift() != null) {
            schedule.setShift(request.getShift());
        }

        if (request.getStatus() != null) {
            schedule.setStatus(request.getStatus());
        }

        // ❌ REMOVED: schedule.setUpdatedAt(LocalDateTime.now());

        Schedule updatedSchedule = scheduleRepository.save(schedule);
        log.info("✅ Schedule updated successfully: {}", updatedSchedule.getId());

        return convertToDTO(updatedSchedule);
    }

    // ============================================
    // DELETE SCHEDULE
    // ============================================
    @Transactional
    public void deleteSchedule(String id) {
        log.info("🗑️ Deleting schedule: {}", id);

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with id: " + id));

        scheduleRepository.delete(schedule);
        log.info("✅ Schedule deleted successfully: {}", id);
    }

    // ============================================
    // DELETE SCHEDULES BY DATE
    // ============================================
    @Transactional
    public void deleteSchedulesByDate(String dateStr) {
        log.info("🗑️ Deleting schedules for date: {}", dateStr);
        LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
        List<Schedule> schedules = scheduleRepository.findByDate(date);
        scheduleRepository.deleteAll(schedules);
        log.info("✅ Deleted {} schedules for date: {}", schedules.size(), dateStr);
    }

    // ============================================
    // GET SCHEDULE STATS
    // ============================================
    @Transactional(readOnly = true)
    public ScheduleStats getScheduleStats() {
        log.info("📊 Fetching schedule stats");

        long totalSchedules = scheduleRepository.count();
        long totalToday = scheduleRepository.findByDate(LocalDate.now()).size();
        long totalThisWeek = scheduleRepository.countByDateBetween(
                LocalDate.now().minusDays(7), LocalDate.now().plusDays(7));

        return ScheduleStats.builder()
                .totalSchedules(totalSchedules)
                .todaySchedules(totalToday)
                .weekSchedules(totalThisWeek)
                .build();
    }

    // ============================================
    // PRIVATE METHODS
    // ============================================
    private ScheduleDTO convertToDTO(Schedule schedule) {
        return ScheduleDTO.builder()
                .id(schedule.getId())
                .employeeId(schedule.getEmployee().getId())
                .employeeName(schedule.getEmployeeName())
                .employeeEmail(schedule.getEmployeeEmail())
                .date(schedule.getDate() != null ? schedule.getDate().toString() : null)
                .shift(schedule.getShift())
                .status(schedule.getStatus())
                .createdBy(schedule.getCreatedBy())
                .createdAt(schedule.getCreatedAt())
                // ❌ REMOVED: .updatedAt(schedule.getUpdatedAt())
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElse(null);
    }

    // ============================================
    // INNER CLASS FOR STATS
    // ============================================
    @lombok.Builder
    @lombok.Data
    public static class ScheduleStats {
        private long totalSchedules;
        private long todaySchedules;
        private long weekSchedules;
    }
}