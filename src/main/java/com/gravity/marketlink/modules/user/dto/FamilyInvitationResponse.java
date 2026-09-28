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
@Schema(description = "Family group invitation information")
public class FamilyInvitationResponse {

    @Schema(description = "Invitation ID", example = "1")
    private Long invitationId;

    @Schema(description = "Inviter ID (Customer Head)", example = "3")
    private Long inviterId;

    @Schema(description = "Inviter full name", example = "Robert Head")
    private String inviterName;

    @Schema(description = "Invited member email", example = "family_member@marketlink.com")
    private String inviteeEmail;

    @Schema(description = "Invitation token code", example = "550e8400-e29b-41d4-a716-446655440000")
    private String invitationToken;

    @Schema(description = "Invitation status: PENDING, ACCEPTED, REJECTED, EXPIRED", example = "PENDING")
    private String status;

    @Schema(description = "Invitation expiration time")
    private LocalDateTime expiresAt;

    @Schema(description = "Invitation creation timestamp")
    private LocalDateTime createdAt;
}
