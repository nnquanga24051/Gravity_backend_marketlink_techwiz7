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
@Schema(description = "Thông tin chi tiết một tài liệu KYC đã nộp")
public class FarmerKycDocumentResponse {

    @Schema(description = "ID tài liệu", example = "1")
    private Long documentId;

    @Schema(description = "ID Nông dân", example = "2")
    private Long farmerId;

    @Schema(description = "Loại tài liệu", example = "CITIZEN_ID_FRONT")
    private String documentType;

    @Schema(description = "URL tài liệu", example = "https://example.com/kyc/cccd-mat-truoc.jpg")
    private String documentUrl;

    @Schema(description = "Số giấy tờ", example = "079090123456")
    private String documentNumber;

    @Schema(description = "Ngày cấp", example = "2022-05-15")
    private LocalDate issuedDate;

    @Schema(description = "Ngày hết hạn", example = "2032-05-15")
    private LocalDate expiryDate;

    @Schema(description = "Thời gian tải lên")
    private LocalDateTime createdAt;
}
