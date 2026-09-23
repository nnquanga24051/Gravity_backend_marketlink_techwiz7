package com.gravity.marketlink.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private String status;
    private String kycStatus;
    private List<String> roles;
    private Object profileDetails;
}
