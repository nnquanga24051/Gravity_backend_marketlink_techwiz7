package com.gravity.marketlink.modules.user.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("favorites")
public class Favorite {

    @Id
    @Column("favorite_id")
    private Long favoriteId;

    @Column("customer_id")
    private Long customerId;

    @Column("target_type")
    private String targetType; // FARMER, PRODUCT, MARKET

    @Column("target_id")
    private Long targetId;

    @Column("created_at")
    private LocalDateTime createdAt;
}
