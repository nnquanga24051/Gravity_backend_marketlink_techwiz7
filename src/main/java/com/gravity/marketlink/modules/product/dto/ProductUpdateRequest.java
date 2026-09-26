package com.gravity.marketlink.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateRequest {

    private Long marketId;

    private String stallNumber;

    private Integer categoryId;

    private String name;

    private String description;

    private String unit;

    private BigDecimal price;

    private BigDecimal currentStock;

    private String imageUrl;

    private String status; // AVAILABLE, SOLD_OUT, TEMPORARILY_UNAVAILABLE, BANNED
}
