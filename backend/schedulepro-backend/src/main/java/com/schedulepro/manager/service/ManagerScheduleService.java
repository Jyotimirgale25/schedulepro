package com.schedulepro.manager.service;

import com.schedulepro.employee.entity.Schedule;
import com.schedulepro.employee.repository.ScheduleRepository;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.manager.dto.request.ScheduleRequestDTO;
import com.schedulepro.employee.dto.response.ScheduleResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    @Transactional
    public ScheduleResponseDTO createSchedule(String managerEmail, ScheduleRequestDTO request) {
        System.out.println("========== DEBUG START ==========");
        System.out.println("1. Manager Email: " + managerEmail);
        System.out.println("2. Request Employee ID: '" + request.getEmployeeId() + "'");
        System.out.println("3. Request Date: " + request.getDate());
        System.out.println("4. Request Shift: " + request.getShift());

        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        // ✅ Find employee by ID (UUID as String)
        System.out.println("Looking for employee with ID: '" + request.getEmployeeId() + "'");
        User employee = userRepository.findById(request.getEmployeeId()).orElse(null);

        // ✅ If not found, try as numeric ID (for backward compatibility)
        if (employee == null) {
            try {
                Long numericId = Long.parseLong(request.getEmployeeId());
                employee = userRepository.findById(String.valueOf(numericId)).orElse(null);
                System.out.println("Trying numeric ID: " + numericId);
            } catch (NumberFormatException ex) {
                System.out.println("ID is not a number: " + request.getEmployeeId());
            }
        }

        // If still not found, throw error
        if (employee == null) {
            throw new RuntimeException("Employee not found with ID: '" + request.getEmployeeId() + "'");
        }

        System.out.println("5. Employee Found: " + employee.getEmail());
        System.out.println("6. Employee Manager ID: " + employee.getManagerId());
        System.out.println("7. Manager ID: " + manager.getId());

        if (employee.getManagerId() == null || !employee.getManagerId().equals(manager.getId())) {
            throw new RuntimeException("You can only create schedules for your team members");
        }

        LocalDate scheduleDate = LocalDate.parse(request.getDate(), formatter);

        Schedule schedule = new Schedule();
        schedule.setEmployee(employee);
        schedule.setEmployeeName(employee.getFullName());
        schedule.setEmployeeEmail(employee.getEmail());
        schedule.setDate(scheduleDate);
        schedule.setShift(request.getShift());
        schedule.setStatus("Scheduled");
        schedule.setCreatedBy(manager.getId());

        Schedule saved = scheduleRepository.save(schedule);
        System.out.println("8. Schedule Saved with ID: " + saved.getId());
        System.out.println("========== DEBUG END ==========");

        return convertToDTO(saved);
    }


    public List<ScheduleResponseDTO> getTeamSchedules(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> teamMembers = userRepository.findByManagerId(manager.getId());
        if (teamMembers.isEmpty()) return List.of();

        List<String> teamMemberIds = teamMembers.stream()
                .map(User::getId)
                .collect(Collectors.toList());

        return scheduleRepository.findByEmployeeIdIn(teamMemberIds)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSchedule(String managerEmail, String scheduleId) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        User employee = schedule.getEmployee();
        if (employee.getManagerId() == null || !employee.getManagerId().equals(manager.getId())) {
            throw new RuntimeException("You can only delete schedules for your team members");
        }
        scheduleRepository.delete(schedule);
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