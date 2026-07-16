package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "employee_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class EmployeeDetails {

    @Id
    private String id;  // Same as User ID

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "employee_id", unique = true)
    private String employeeId;

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group")
    private String bloodGroup;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship")
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Add these fields to your existing EmployeeDetails entity

    // ===== MANAGER-SPECIFIC FIELDS =====
    @Column(name = "office_location")
    private String officeLocation;

    @Column(name = "work_email")
    private String workEmail;

    @Column(name = "team_size")
    private Integer teamSize;

    @Column(name = "department_head")
    private Boolean departmentHead = false;

    @Column(name = "manager_level")
    private String managerLevel;

    @Column(name = "reports_to")
    private String reportsTo;

    @Column(name = "employee_count")
    private Integer employeeCount;

    // ===== SKILLS & LANGUAGES =====
    @ElementCollection
    @CollectionTable(
            name = "employee_skills",
            joinColumns = @JoinColumn(name = "employee_details_id")
    )
    @Column(name = "skill")
    private List<String> skills = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "employee_languages",
            joinColumns = @JoinColumn(name = "employee_details_id")
    )
    @Column(name = "language")
    private List<String> languages = new ArrayList<>();

    // ===== MANAGED DEPARTMENTS =====
    @ElementCollection
    @CollectionTable(
            name = "managed_departments",
            joinColumns = @JoinColumn(name = "employee_details_id")
    )
    @Column(name = "department")
    private List<String> managedDepartments = new ArrayList<>();

    // ===== SOCIAL LINKS =====
    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "twitter_url")
    private String twitterUrl;
}