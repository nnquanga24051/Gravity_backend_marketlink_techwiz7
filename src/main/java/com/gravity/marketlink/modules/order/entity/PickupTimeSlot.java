package com.gravity.marketlink.modules.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("pickup_time_slots")
public class PickupTimeSlot {

    @Id
    @Column("slot_id")
    private Long slotId;

    @Column("market_id")
    private Long marketId;

    @Column("slot_name")
    private String slotName; // Morning Early (07:00-08:00)

    @Column("start_time")
    private LocalTime startTime;

    @Column("end_time")
    private LocalTime endTime;

    @Column("max_orders")
    @Builder.Default
    private Integer maxOrders = 30;
}
