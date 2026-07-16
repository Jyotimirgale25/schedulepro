package com.schedulepro.employee.service;

import com.schedulepro.employee.entity.Schedule;
import com.schedulepro.employee.repository.ScheduleRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.employee.dto.response.ScheduleResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public List<ScheduleResponseDTO> getMySchedules(String email, String view, String dateStr) {
        System.out.println("🔍 Employee email: " + email);

        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("🔍 Employee ID: " + employee.getId());
        System.out.println("🔍 View: " + view);
        System.out.println("🔍 Date string received: " + dateStr);

        List<Schedule> schedules;

        if ("week".equals(view) && dateStr != null && !dateStr.isEmpty()) {
            // ✅ Extract only the date part (first 10 characters)
            String dateOnly = dateStr.length() > 10 ? dateStr.substring(0, 10) : dateStr;
            System.out.println("🔍 Date only: " + dateOnly);

            LocalDate date = LocalDate.parse(dateOnly, formatter);
            LocalDate startOfWeek = date.minusDays(date.getDayOfWeek().getValue() - 1);
            LocalDate endOfWeek = startOfWeek.plusDays(6);
            System.out.println("🔍 Week range: " + startOfWeek + " to " + endOfWeek);
            schedules = scheduleRepository.findByEmployeeAndDateBetweenOrderByDateAsc(employee, startOfWeek, endOfWeek);
        } else {
            schedules = scheduleRepository.findByEmployeeOrderByDateAsc(employee);
        }

        System.out.println("🔍 Schedules found: " + schedules.size());
        schedules.forEach(s -> System.out.println("  - " + s.getDate() + ": " + s.getShift()));

        return schedules.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    public List<ScheduleResponseDTO> getUpcomingSchedules(String email) {
        User employee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return scheduleRepository.findUpcomingByEmployee(employee)
                .stream()
                .limit(5)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ScheduleResponseDTO convertToDTO(Schedule schedule) {
        return ScheduleResponseDTO.builder()
                .id(schedule.getId())
                .date(schedule.getDate().toString())
                .shift(schedule.getShift())
                .status(schedule.getStatus())
                .employeeName(schedule.getEmployeeName())
                .build();
    }
}