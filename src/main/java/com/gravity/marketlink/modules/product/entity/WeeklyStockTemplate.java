package com.gravity.marketlink.modules.product.entity;

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
@Table("weekly_stock_templates")
public class WeeklyStockTemplate {

    @Id
    @Column("template_id")
    private Long templateId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("product_id")
    private Long productId;

    @Column("market_id")
    private Long marketId;

    @Column("day_of_week")
    private Integer dayOfWeek;

    @Column("recurring_quantity")
    private BigDecimal recurringQuantity;

    @Column("is_active")
    @Builder.Default
    private Boolean isActive = true;
}
