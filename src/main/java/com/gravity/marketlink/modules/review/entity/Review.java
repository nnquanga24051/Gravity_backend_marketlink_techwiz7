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

    @Column("rating")
    private Integer rating; // 1 to 5

    @Column("comment")
    private String comment;

    @Column("farmer_reply")
    private String farmerReply;

    @Column("farmer_reply_at")
    private LocalDateTime farmerReplyAt;

    @Column("is_hidden")
    @Builder.Default
    private Boolean isHidden = false;

    @Column("created_at")
    private LocalDateTime createdAt;
}
