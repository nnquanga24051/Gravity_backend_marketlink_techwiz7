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
@Schema(description = "Thông tin chi tiết một tài liệu KYC của Nông dân")
public class FarmerKycItemRequest {

    @NotBlank(message = "URL tài liệu không được để trống")
    @Schema(description = "Đường dẫn hình ảnh/tài liệu đã tải lên", example = "https://example.com/kyc/cccd-mat-truoc.jpg")
    private String documentUrl;

    @Schema(description = "Số giấy tờ/chứng nhận nếu có", example = "079090123456")
    private String documentNumber;

    @Schema(description = "Ngày cấp", example = "2022-05-15")
    private LocalDate issuedDate;

    @Schema(description = "Ngày hết hạn nếu có", example = "2032-05-15")
    private LocalDate expiryDate;
}
