package com.schedulepro.manager.service;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import com.schedulepro.manager.dto.response.TeamMemberDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerTeamService {

    private final UserRepository userRepository;

    public List<TeamMemberDTO> getTeamMembers(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        List<User> teamMembers = userRepository.findByManagerId(manager.getId());

        if (teamMembers.isEmpty()) {
            return getDemoTeamMembers();
        }

        return teamMembers.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // ✅ REPLACE THIS METHOD
    @Transactional
    public void removeTeamMember(String managerEmail, String employeeId) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        User employee = userRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        // Verify this employee belongs to this manager
        if (employee.getManagerId() == null || !employee.getManagerId().equals(manager.getId())) {
            throw new RuntimeException("You can only remove your own team members");
        }

        // Clear the manager_id to remove from team
        employee.setManagerId(null);
        userRepository.save(employee);

        System.out.println("✅ Removed " + employee.getEmail() + " from " + manager.getEmail() + "'s team");
    }

    private TeamMemberDTO convertToDTO(User user) {
        return TeamMemberDTO.builder()
                .id(user.getId())
                .name(user.getFullName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .department(user.getDepartment() != null ? user.getDepartment() : "IT")
                .position(user.getPosition() != null ? user.getPosition() : "Team Member")
                .joinDate(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDate().toString() : LocalDate.now().toString())
                .status(user.getIsActive() ? "ACTIVE" : "INACTIVE")
                .build();
    }

    private List<TeamMemberDTO> getDemoTeamMembers() {
        List<TeamMemberDTO> demoTeam = new ArrayList<>();
        demoTeam.add(TeamMemberDTO.builder()
                .id("demo-1")
                .name(" ForDemo")
                .fullName("ForDemo")
                .email("Demo@company.com")
                .department("IT")
                .position("Software Developer")
                .joinDate("2024-01-15")
                .status("ACTIVE")
                .build());

        return demoTeam;
    }
}