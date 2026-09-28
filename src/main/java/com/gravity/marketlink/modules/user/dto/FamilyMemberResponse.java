package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Family account member details")
public class FamilyMemberResponse {

    @Schema(description = "Customer ID", example = "3")
    private Long customerId;

    @Schema(description = "Full name", example = "Mary Member")
    private String fullName;

    @Schema(description = "Email", example = "wife@marketlink.com")
    private String email;

    @Schema(description = "Phone number", example = "0987111222")
    private String phoneNumber;

    @Schema(description = "Avatar image URL")
    private String avatarUrl;

    @Schema(description = "Whether user is family head or dependent member", example = "false")
    private Boolean isHeadOfFamily;

    @Schema(description = "Default delivery address")
    private String defaultAddress;

    @Schema(description = "Joined timestamp")
    private LocalDateTime joinedAt;
}
