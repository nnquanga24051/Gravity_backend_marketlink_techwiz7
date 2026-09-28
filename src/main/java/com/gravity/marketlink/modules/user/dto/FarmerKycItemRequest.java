package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Farmer KYC document submission details")
public class FarmerKycItemRequest {

    @NotBlank(message = "Document URL cannot be blank")
    @Schema(description = "Uploaded image/document file URL", example = "https://example.com/kyc/cccd-mat-truoc.jpg")
    private String documentUrl;

    @Schema(description = "Document / Certificate number (optional)", example = "079090123456")
    private String documentNumber;

    @Schema(description = "Issuance date", example = "2022-05-15")
    private LocalDate issuedDate;

    @Schema(description = "Expiration date (optional)", example = "2032-05-15")
    private LocalDate expiryDate;
}
