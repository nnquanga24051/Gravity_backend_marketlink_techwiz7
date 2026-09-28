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
@Schema(description = "Request to change user account active status")
public class AdminUpdateUserStatusRequest {

    @NotBlank(message = "New status cannot be blank")
    @Schema(description = "New status: ACTIVE, SUSPENDED, PENDING", example = "SUSPENDED")
    private String status;

    @Schema(description = "Reason for suspending or activating account", example = "Violation of marketplace policies or fraud complaint.")
    private String reason;
}
