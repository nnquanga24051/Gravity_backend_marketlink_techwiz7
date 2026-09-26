package com.gravity.marketlink.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailResponse {

    private Long orderId;
    private String orderCode;

    private Long customerId;
    private String customerName;
    private String customerPhone;

    private Long farmerId;
    private String farmerName;
    private String stallName;

    private Long marketId;
    private String marketName;
    private String marketAddress;

    private Long slotId;
    private String slotTimeRange;

    private LocalDate pickupDate;
    private LocalDateTime cutoffTime;

    private BigDecimal totalAmount;
    private String orderStatus;
    private String paymentMethod;
    private String note;

    private Boolean canCancel;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<OrderItemResponse> items;

    private Boolean hasReview;
}
