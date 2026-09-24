package com.gravity.marketlink.modules.order.dto;

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
public class BestSellingProductDto {

    @Schema(description = "Mã sản phẩm nông sản", example = "1")
    private Long productId;

    @Schema(description = "Tên sản phẩm", example = "Cà chua hữu cơ Ba Vì")
    private String productName;

    @Schema(description = "Đơn vị tính", example = "kg")
    private String unit;

    @Schema(description = "Ảnh đại diện sản phẩm", example = "https://example.com/images/tomato.jpg")
    private String imageUrl;

    @Schema(description = "Tổng sản lượng đã bán thành công", example = "150.5")
    private BigDecimal totalSoldQuantity;

    @Schema(description = "Tổng doanh thu từ sản phẩm này", example = "4500000")
    private BigDecimal totalRevenue;

    @Schema(description = "Số lượng đơn hàng có chứa sản phẩm này", example = "35")
    private Long orderCount;
}
