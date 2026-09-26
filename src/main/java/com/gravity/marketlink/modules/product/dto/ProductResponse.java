package com.gravity.marketlink.modules.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long productId;
    private Long farmerId;
    private String farmerStallName;
    private String farmAddress;
    private Long marketId;
    private String marketName;
    private String stallNumber;
    private Integer categoryId;
    private String categoryName;
    private String name;
    private String description;
    private String unit;
    private BigDecimal price;
    private BigDecimal currentStock;
    private String imageUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
