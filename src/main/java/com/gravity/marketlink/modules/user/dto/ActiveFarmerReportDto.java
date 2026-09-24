package com.gravity.marketlink.modules.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveFarmerReportDto {

    @Schema(description = "Mã nông dân", example = "2")
    private Long farmerId;

    @Schema(description = "Tên sạp hàng / Nông trại", example = "Nông Trại Hữu Cơ Ba Vì")
    private String stallName;

    @Schema(description = "Họ tên chủ nông trại", example = "Nguyễn Văn Hoàng")
    private String fullName;

    @Schema(description = "Số điện thoại liên hệ", example = "0987654321")
    private String phoneNumber;

    @Schema(description = "Số đơn hàng đã hoàn tất thành công", example = "65")
    private Long completedOrders;

    @Schema(description = "Tổng doanh thu bán hàng", example = "18200000")
    private BigDecimal totalRevenue;
}
