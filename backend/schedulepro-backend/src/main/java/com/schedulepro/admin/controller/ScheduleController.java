// src/main/java/com/schedulepro/admin/controller/ScheduleController.java
package com.schedulepro.admin.controller;

import com.schedulepro.admin.dto.request.CreateScheduleRequest;
import com.schedulepro.admin.dto.request.UpdateScheduleRequest;
import com.schedulepro.admin.dto.response.ScheduleDTO;
import com.schedulepro.admin.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.schedulepro.admin.service.ScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/schedules")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ScheduleController {

    private final ScheduleService scheduleService;

    // ============================================
    // GET ALL SCHEDULES
    // ============================================
    @GetMapping
    public ResponseEntity<List<ScheduleDTO>> getAllSchedules() {
        log.info("GET /api/admin/schedules - Fetching all schedules");
        return ResponseEntity.ok(scheduleService.getAllSchedules());
    }

    // ============================================
    // GET SCHEDULE BY ID
    // ============================================
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleDTO> getScheduleById(@PathVariable String id) {
        log.info("GET /api/admin/schedules/{} - Fetching schedule", id);
        return ResponseEntity.ok(scheduleService.getScheduleById(id));
    }

    // ============================================
    // GET SCHEDULES BY DATE
    // ============================================
    @GetMapping("/date/{date}")
    public ResponseEntity<List<ScheduleDTO>> getSchedulesByDate(@PathVariable String date) {
        log.info("GET /api/admin/schedules/date/{} - Fetching schedules by date", date);
        return ResponseEntity.ok(scheduleService.getSchedulesByDate(date));
    }

    // ============================================
    // GET SCHEDULES BY DATE RANGE
    // ============================================
    @GetMapping("/range")
    public ResponseEntity<List<ScheduleDTO>> getSchedulesByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        log.info("GET /api/admin/schedules/range - Fetching schedules between {} and {}", start, end);
        return ResponseEntity.ok(scheduleService.getSchedulesByDateRange(start, end));
    }

    // ============================================
    // GET SCHEDULES BY EMPLOYEE
    // ============================================
    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<ScheduleDTO>> getSchedulesByEmployee(@PathVariable String employeeId) {
        log.info("GET /api/admin/schedules/employee/{} - Fetching schedules for employee", employeeId);
        return ResponseEntity.ok(scheduleService.getSchedulesByEmployee(employeeId));
    }

    // ============================================
    // CREATE SCHEDULE
    // ============================================
    @PostMapping
    public ResponseEntity<ScheduleDTO> createSchedule(@Valid @RequestBody CreateScheduleRequest request) {
        log.info("POST /api/admin/schedules - Creating new schedule");
        ScheduleDTO createdSchedule = scheduleService.createSchedule(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdSchedule);
    }

    // ============================================
    // UPDATE SCHEDULE
    // ============================================
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleDTO> updateSchedule(
            @PathVariable String id,
            @Valid @RequestBody UpdateScheduleRequest request) {
        log.info("PUT /api/admin/schedules/{} - Updating schedule", id);
        return ResponseEntity.ok(scheduleService.updateSchedule(id, request));
    }

    // ============================================
    // DELETE SCHEDULE
    // ============================================
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteSchedule(@PathVariable String id) {
        log.info("DELETE /api/admin/schedules/{} - Deleting schedule", id);
        scheduleService.deleteSchedule(id);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Schedule deleted successfully");
        return ResponseEntity.ok(response);
    }

    // ============================================
    // DELETE SCHEDULES BY DATE
    // ============================================
    @DeleteMapping("/date/{date}")
    public ResponseEntity<Map<String, String>> deleteSchedulesByDate(@PathVariable String date) {
        log.info("DELETE /api/admin/schedules/date/{} - Deleting schedules by date", date);
        scheduleService.deleteSchedulesByDate(date);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Schedules for " + date + " deleted successfully");
        return ResponseEntity.ok(response);
    }

    // ============================================
    // GET SCHEDULE STATS
    // ============================================
    @GetMapping("/stats")
    public ResponseEntity<ScheduleService.ScheduleStats> getScheduleStats() {
        log.info("GET /api/admin/schedules/stats - Fetching schedule stats");
        return ResponseEntity.ok(scheduleService.getScheduleStats());
    }
}