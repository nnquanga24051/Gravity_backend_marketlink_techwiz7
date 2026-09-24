package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu gửi lời mời thành viên gia đình (Family Account)")
public class FamilyInviteRequest {

    @NotBlank(message = "Email người được mời không được để trống")
    @Email(message = "Email người được mời không hợp lệ")
    @Schema(description = "Email của thành viên gia đình muốn mời", example = "family_member@marketlink.com")
    private String inviteeEmail;
}
