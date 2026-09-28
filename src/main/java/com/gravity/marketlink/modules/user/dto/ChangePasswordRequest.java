package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Password change request payload")
public class ChangePasswordRequest {

    @NotBlank(message = "Current password cannot be blank")
    @Schema(description = "Current active password", example = "Password123@")
    private String currentPassword;

    @NotBlank(message = "New password cannot be blank")
    @Size(min = 6, message = "New password must be at least 6 characters")
    @Schema(description = "New password to update", example = "NewSecurePass@2026")
    private String newPassword;
}
