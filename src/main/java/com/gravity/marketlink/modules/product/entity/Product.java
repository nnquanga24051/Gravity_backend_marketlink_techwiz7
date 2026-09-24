package com.gravity.marketlink.modules.product.entity;

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
@Table("products")
public class Product {

    @Id
    @Column("product_id")
    private Long productId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("category_id")
    private Integer categoryId;

    private String name;

    private String description;

    private String unit;

    private BigDecimal price;

    @Column("current_stock")
    @Builder.Default
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column("image_url")
    private String imageUrl;

    @Builder.Default
    private String status = "AVAILABLE";

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
