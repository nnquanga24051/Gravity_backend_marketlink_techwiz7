package com.gravity.marketlink.modules.review.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.review.dto.ReviewCreateRequest;
import com.gravity.marketlink.modules.review.dto.ReviewReplyRequest;
import com.gravity.marketlink.modules.review.dto.ReviewResponse;
import com.gravity.marketlink.modules.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "6. Customer Reviews & Ratings", description = "APIs for reviewing completed pre-orders and farmer responses")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @Operation(summary = "Customer submits review after completing order", description = "Order must be in COMPLETED status. Each order can only be reviewed once.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/customer/reviews")
    public Mono<ResponseEntity<ApiResponse<ReviewResponse>>> createReview(
            Authentication authentication,
            @Valid @RequestBody ReviewCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> reviewService.createReview(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Review submitted successfully. Thank you!", created)));
    }

    @Operation(summary = "Customer views list of submitted reviews", description = "Retrieves review history for logged-in customer, supports keyword search.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/reviews")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getMyReviews(
            Authentication authentication,
            @RequestParam(value = "keyword", required = false) String keyword) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer account information not found.")))
                .flatMap(user -> reviewService.getCustomerReviews(user.getUserId(), keyword).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved review list successfully.", list)));
    }

    @Operation(summary = "View all reviews for a farmer stall", description = "Public endpoint. Returns publicly visible reviews with keyword search.")
    @GetMapping("/reviews/farmer/{farmerId}")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getFarmerReviews(
            @PathVariable("farmerId") Long farmerId,
            @RequestParam(value = "keyword", required = false) String keyword) {
        return reviewService.getFarmerReviews(farmerId, keyword)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved stall reviews successfully.", list)));
    }

    @Operation(summary = "View all reviews for a product", description = "Public endpoint. Returns reviews for product.")
    @GetMapping("/reviews/product/{productId}")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getProductReviews(@PathVariable("productId") Long productId) {
        return reviewService.getProductReviews(productId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved product reviews successfully.", list)));
    }

    @Operation(summary = "Farmer responds to customer review", description = "Requires ROLE_FARMER authority.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/farmer/reviews/{id}/reply")
    public Mono<ResponseEntity<ApiResponse<ReviewResponse>>> replyReview(
            Authentication authentication,
            @PathVariable("id") Long id,
            @Valid @RequestBody ReviewReplyRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> reviewService.replyReview(user.getUserId(), id, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Review response submitted successfully.", res)));
    }

    @Operation(summary = "Administrator views all reviews", description = "Retrieves all reviews including hidden ones. Supports keyword search and rating/visibility filters. Requires ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/reviews")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getAllReviewsForAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "filter", required = false) String filter) {
        return reviewService.getAllReviewsForAdmin(keyword, filter)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved all reviews successfully.", list)));
    }

    @Operation(summary = "Administrator toggles review visibility", description = "Requires ROLE_ADMIN authority for content moderation.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/reviews/{id}/visibility")
    public Mono<ResponseEntity<ApiResponse<ReviewResponse>>> setReviewVisibility(
            @PathVariable("id") Long id,
            @RequestParam("isHidden") boolean isHidden) {
        return reviewService.setReviewVisibility(id, isHidden)
                .map(res -> ResponseEntity.ok(ApiResponse.success(
                        (isHidden ? "Review hidden from public view." : "Review visibility restored."), res)));
    }
}

