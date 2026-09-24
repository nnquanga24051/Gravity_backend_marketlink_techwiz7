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
public class MarketRevenueReportDto {

    @Schema(description = "Mã chợ", example = "1")
    private Long marketId;

    @Schema(description = "Tên chợ nông sản", example = "Chợ Phiên Nông Sản Ba Vì")
    private String marketName;

    @Schema(description = "Địa chỉ chợ", example = "Thị trấn Tây Đằng, Ba Vì, Hà Nội")
    private String address;

    @Schema(description = "Tổng số đơn hàng phát sinh tại điểm chợ", example = "180")
    private Long totalOrders;

    @Schema(description = "Tổng doanh thu tích lũy tại chợ", example = "24500000")
    private BigDecimal totalRevenue;

    @Schema(description = "Số lượng nông dân đang hoạt động tại chợ", example = "8")
    private Long activeFarmersCount;
}
