package com.gravity.marketlink.modules.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long reviewId;
    private Long orderId;

    private Long customerId;
    private String customerName;
    private String customerAvatar;

    private Long farmerId;
    private String farmerName;
    private String stallName;

    private Long productId;
    private String productName;

    private Integer rating;
    private String comment;

    private String farmerReply;
    private LocalDateTime farmerReplyAt;

    private Boolean isHidden;
    private LocalDateTime createdAt;
}
