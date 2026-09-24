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
public class PlatformMetricsResponse {

    @Schema(description = "Tổng số lượng nông dân đăng ký trên sàn", example = "45")
    private Long totalFarmers;

    @Schema(description = "Tổng số lượng khách hàng đã tạo tài khoản", example = "320")
    private Long totalCustomers;

    @Schema(description = "Tổng số điểm chợ nông sản địa phương", example = "12")
    private Long totalMarkets;

    @Schema(description = "Tổng số đơn đặt trước đã tạo", example = "1540")
    private Long totalOrders;

    @Schema(description = "Tổng doanh thu toàn sàn từ các đơn đã giao thành công", example = "125000000")
    private BigDecimal totalRevenue;

    @Schema(description = "Số lượng hồ sơ KYC nông dân đang chờ phê duyệt", example = "5")
    private Long pendingKycCount;
}
