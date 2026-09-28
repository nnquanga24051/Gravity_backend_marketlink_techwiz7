package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Detailed submitted KYC document information")
public class FarmerKycDocumentResponse {

    @Schema(description = "Document ID", example = "1")
    private Long documentId;

    @Schema(description = "Farmer ID", example = "2")
    private Long farmerId;

    @Schema(description = "Document URL", example = "https://example.com/kyc/cccd-mat-truoc.jpg")
    private String documentUrl;

    @Schema(description = "Document number", example = "079090123456")
    private String documentNumber;

    @Schema(description = "Issuance date", example = "2022-05-15")
    private LocalDate issuedDate;

    @Schema(description = "Expiration date", example = "2032-05-15")
    private LocalDate expiryDate;

    @Schema(description = "Upload timestamp")
    private LocalDateTime createdAt;
}
