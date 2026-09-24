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
@Schema(description = "Yêu cầu chấp nhận lời mời tham gia nhóm gia đình")
public class FamilyAcceptInviteRequest {

    @NotBlank(message = "Mã token lời mời không được để trống")
    @Schema(description = "Token lời mời gia đình đã nhận được", example = "550e8400-e29b-41d4-a716-446655440000")
    private String invitationToken;
}
