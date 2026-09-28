package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Accept family group invitation request")
public class FamilyAcceptInviteRequest {

    @NotBlank(message = "Invitation token cannot be blank")
    @Schema(description = "Received family invitation token", example = "550e8400-e29b-41d4-a716-446655440000")
    private String invitationToken;
}
