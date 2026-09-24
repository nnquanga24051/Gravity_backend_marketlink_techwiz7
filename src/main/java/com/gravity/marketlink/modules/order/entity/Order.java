package com.gravity.marketlink.modules.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("orders")
public class Order {

    @Id
    @Column("order_id")
    private Long orderId;

    @Column("order_code")
    private String orderCode;

    @Column("customer_id")
    private Long customerId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("market_id")
    private Long marketId;

    @Column("slot_id")
    private Long slotId;

    @Column("pickup_date")
    private LocalDate pickupDate;

    @Column("cutoff_time")
    private LocalDateTime cutoffTime;

    @Column("total_amount")
    private BigDecimal totalAmount;

    @Column("order_status")
    @Builder.Default
    private String orderStatus = "PLACED"; // PLACED, ACCEPTED, DECLINED, READY_FOR_PICKUP, COMPLETED, CANCELLED

    @Column("payment_method")
    @Builder.Default
    private String paymentMethod = "PAY_AT_PICKUP";

    @Column("note")
    private String note;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
