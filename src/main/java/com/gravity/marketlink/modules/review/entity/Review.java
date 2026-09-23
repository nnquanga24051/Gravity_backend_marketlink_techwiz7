package com.gravity.marketlink.modules.review.entity;

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
@Table("reviews")
public class Review {

    @Id
    @Column("review_id")
    private Long reviewId;

    @Column("order_id")
    private Long orderId;

    @Column("customer_id")
    private Long customerId;

    @Column("farmer_id")
    private Long farmerId;

    @Column("product_id")
    private Long productId;

    private Integer rating; // 1 to 5

    private String comment;

    @Column("image_url")
    private String imageUrl;

    @Column("is_hidden")
    @Builder.Default
    private Boolean isHidden = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
