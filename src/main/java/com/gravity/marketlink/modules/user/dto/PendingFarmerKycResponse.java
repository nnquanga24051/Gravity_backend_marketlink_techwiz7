package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin tóm tắt hồ sơ KYC của Nông dân chờ duyệt")
public class PendingFarmerKycResponse {

    @Schema(description = "ID Nông dân", example = "2")
    private Long farmerId;

    @Schema(description = "Họ và tên nông dân", example = "Nguyen Van A")
    private String fullName;

    @Schema(description = "Email", example = "farmer1@marketlink.com")
    private String email;

    @Schema(description = "Số điện thoại", example = "0901234567")
    private String phoneNumber;

    @Schema(description = "Tên gian hàng / tên trang trại", example = "Nông Trại Xanh Ba Vì")
    private String stallName;

    @Schema(description = "Địa chỉ trang trại", example = "Thôn 2, Xã Vân Hòa, Ba Vì, Hà Nội")
    private String farmAddress;

    @Schema(description = "Trạng thái KYC", example = "PENDING")
    private String kycStatus;

    @Schema(description = "Số lượng tài liệu đã nộp", example = "3")
    private Integer documentCount;

    @Schema(description = "Ngày gửi hồ sơ gần nhất")
    private LocalDateTime lastSubmittedAt;
}
