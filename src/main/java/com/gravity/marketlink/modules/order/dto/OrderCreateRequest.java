package com.gravity.marketlink.modules.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreateRequest {

    @NotNull(message = "Farmer ID (farmerId) cannot be null")
    private Long farmerId;

    @NotNull(message = "Market ID (marketId) cannot be null")
    private Long marketId;

    @NotNull(message = "Pickup slot ID (slotId) cannot be null")
    private Long slotId;

    @NotNull(message = "Pickup date (pickupDate) cannot be null")
    @Schema(example = "2026-09-27", description = "Scheduled pickup date at farmers market")
    private LocalDate pickupDate;

    private String note;

    @NotEmpty(message = "Order must contain at least 1 product item")
    @Valid
    private List<OrderItemRequest> items;
}
