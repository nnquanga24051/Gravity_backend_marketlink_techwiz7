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
public class WeeklyStockTemplateResponse {

    private Long templateId;
    private Long farmerId;
    private Long productId;
    private String productName;
    private String productUnit;
    private BigDecimal productPrice;
    private Long marketId;
    private String marketName;
    private Integer dayOfWeek;
    private BigDecimal recurringQuantity;
    private Boolean isActive;
}
