package com.gravity.marketlink.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderSummaryResponse {

    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long placedOrders;
    private Long acceptedOrders;
    private Long readyOrders;
    private Long completedOrders;
    private Long cancelledOrders;
    private Long declinedOrders;
}
