package com.schedulepro.employee.entity;

import com.schedulepro.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "leave_balance")
@Data
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "casual_leaves")
    private Integer casualLeaves = 12;

    @Column(name = "sick_leaves")
    private Integer sickLeaves = 10;

    @Column(name = "annual_leaves")
    private Integer annualLeaves = 15;

    @Column(name = "emergency_leaves")
    private Integer emergencyLeaves = 3;
}