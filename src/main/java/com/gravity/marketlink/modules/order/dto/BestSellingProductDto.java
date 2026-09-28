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

    @Schema(description = "Produce product ID", example = "1")
    private Long productId;

    @Schema(description = "Product name", example = "Organic Vine Tomatoes")
    private String productName;

    @Schema(description = "Unit of measurement", example = "kg")
    private String unit;

    @Schema(description = "Product thumbnail image URL", example = "https://example.com/images/tomato.jpg")
    private String imageUrl;

    @Schema(description = "Total units sold successfully", example = "150.5")
    private BigDecimal totalSoldQuantity;

    @Schema(description = "Total revenue generated from this product", example = "4500000")
    private BigDecimal totalRevenue;

    @Schema(description = "Total order count containing this product", example = "35")
    private Long orderCount;
}
