package com.gravity.marketlink.modules.market.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("markets")
public class Market {

    @Id
    @Column("market_id")
    private Long marketId;

    private String name;

    private String address;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private String description;

    @Column("image_url")
    private String imageUrl;

    @Builder.Default
    private String status = "ACTIVE";

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
