package com.schedulepro.manager.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TeamMemberDTO {
    private String id;
    private String name;
    private String fullName;
    private String email;
    private String department;
    private String position;
    private String joinDate;
    private String status;
}