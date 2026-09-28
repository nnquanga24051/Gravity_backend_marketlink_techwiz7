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
@Schema(description = "Admin request to review farmer KYC application")
public class AdminKycReviewRequest {

    @NotBlank(message = "Review action cannot be blank")
    @Schema(description = "Action: APPROVE, REJECT, REQUEST_REVISION", example = "APPROVE")
    private String action;

    @Schema(description = "Reason or feedback note for farmer", example = "Documents valid, VietGAP certification code verified successfully.")
    private String reason;
}
