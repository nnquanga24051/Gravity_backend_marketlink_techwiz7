package com.gravity.marketlink.modules.order.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("order_items")
public class OrderItem {

    @Id
    @Column("order_item_id")
    private Long orderItemId;

    @Column("order_id")
    private Long orderId;

    @Column("product_id")
    private Long productId;

    @Column("quantity")
    private BigDecimal quantity;

    @Column("unit_price")
    private BigDecimal unitPrice;

    @Column("subtotal")
    private BigDecimal subtotal;
}
