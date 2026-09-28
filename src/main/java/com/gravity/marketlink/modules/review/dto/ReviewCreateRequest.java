package com.gravity.marketlink.modules.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewCreateRequest {

    @NotNull(message = "Order ID cannot be null")
    private Long orderId;

    private Long productId;

    @NotNull(message = "Rating score cannot be null")
    @Min(value = 1, message = "Minimum rating score is 1 star")
    @Max(value = 5, message = "Maximum rating score is 5 stars")
    private Integer rating;

    private String comment;
}
