package com.gravity.marketlink.modules.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickupSlotResponse {

    private Long slotId;
    private Long farmerId;
    private String farmerName;
    private String stallName;
    private Long marketId;
    private String marketName;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer maxOrdersCapacity;
    private String timeRange; // e.g. "07:00 - 08:00"
}
