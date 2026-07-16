package com.schedulepro.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.schedulepro.employee.entity.LeaveRequest;
import com.schedulepro.employee.entity.Schedule;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    // ============================================
    // PRIMARY KEY
    // ============================================
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    // ============================================
    // RELATIONSHIPS
    // ============================================
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LeaveRequest> leaveRequests;

    @JsonIgnore
    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Schedule> schedules;

    // ============================================
    // AUTHENTICATION FIELDS
    // ============================================
    @Column(name = "username", unique = true, nullable = false, length = 50)
    private String username;

    @Column(name = "email", unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password", nullable = true, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "role", nullable = false, length = 20)
    private String role = "EMPLOYEE";

    // ============================================
    // CONTACT INFORMATION
    // ============================================
    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "alternate_phone", length = 20)
    private String alternatePhone;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    // ============================================
    // WORK INFORMATION
    // ============================================
    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "position", length = 100)
    private String position;

    @Column(name = "employee_id", unique = true, length = 50)
    private String employeeId;

    @Column(name = "manager_id", length = 36)
    private String managerId;

    // ============================================
    // PERSONAL INFORMATION
    // ============================================
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    // ============================================
    // SKILLS & LANGUAGES
    // ============================================
    @Column(name = "skills", columnDefinition = "TEXT")
    private String skills;

    @Column(name = "languages", columnDefinition = "TEXT")
    private String languages;

    // ============================================
    // EMERGENCY CONTACT
    // ============================================
    @Column(name = "emergency_contact_name", length = 100)
    private String emergencyContactName;

    @Column(name = "emergency_contact_relationship", length = 50)
    private String emergencyContactRelationship;

    @Column(name = "emergency_contact_phone", length = 20)
    private String emergencyContactPhone;

    // ============================================
    // SOCIAL LINKS
    // ============================================
    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "twitter_url", length = 255)
    private String twitterUrl;

    // ============================================
    // OAUTH2 FIELDS
    // ============================================
    @Column(name = "provider", length = 50)
    private String provider;  // "google", "github", "facebook", etc.

    @Column(name = "provider_id", length = 255)
    private String providerId;  // External provider's unique user ID

    // ============================================
    // STATUS FIELDS
    // ============================================
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // ============================================
    // TIMESTAMPS
    // ============================================
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ============================================
    // USER DETAILS METHODS (Spring Security)
    // ============================================
    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getUsername() {
        return email;  // Using email as username for authentication
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return isActive != null && isActive;
    }

    // ============================================
    // CONVENIENCE METHODS
    // ============================================

    // ----- Role Checks -----
    public boolean isAdmin() {
        return "ADMIN".equalsIgnoreCase(role);
    }

    public boolean isManager() {
        return "MANAGER".equalsIgnoreCase(role);
    }

    public boolean isEmployee() {
        return "EMPLOYEE".equalsIgnoreCase(role);
    }

    // ----- Status Checks -----
    public boolean isActive() {
        return isActive != null && isActive;
    }

    public boolean isVerified() {
        return isVerified != null && isVerified;
    }

    // ----- OAuth2 Checks -----
    public boolean isOAuth2User() {
        return provider != null && !provider.isEmpty();
    }

    public boolean isGoogleUser() {
        return "google".equalsIgnoreCase(provider);
    }

    public boolean isGithubUser() {
        return "github".equalsIgnoreCase(provider);
    }

    // ----- Name Helper -----
    public String getName() {
        return fullName;
    }

    public void setName(String name) {
        this.fullName = name;
    }

    // ============================================
    // GETTERS/SETTERS FOR BOOLEANS
    // ============================================
    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsVerified() {
        return isVerified;
    }

    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
}