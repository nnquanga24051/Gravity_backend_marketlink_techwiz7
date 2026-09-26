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

@Tag(name = "6. Đánh giá & Phản hồi (Reviews)", description = "Các API đánh giá sau khi hoàn tất nhận hàng và phản hồi của nông dân")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    @Operation(summary = "Khách hàng gửi đánh giá sau khi hoàn tất đơn hàng", description = "Đơn hàng phải ở trạng thái COMPLETED. Mỗi đơn hàng được đánh giá một lần.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/customer/reviews")
    public Mono<ResponseEntity<ApiResponse<ReviewResponse>>> createReview(
            Authentication authentication,
            @Valid @RequestBody ReviewCreateRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> reviewService.createReview(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Gửi đánh giá thành công. Cảm ơn bạn!", created)));
    }

    @Operation(summary = "Khách hàng xem danh sách các đánh giá mình đã gửi", description = "Lấy lịch sử đánh giá của khách hàng đang đăng nhập.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/customer/reviews")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getMyReviews(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản khách hàng.")))
                .flatMap(user -> reviewService.getCustomerReviews(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách đánh giá thành công.", list)));
    }

    @Operation(summary = "Xem tất cả đánh giá của một gian hàng nông dân", description = "Public endpoint. Trả về các đánh giá hiển thị công khai.")
    @GetMapping("/reviews/farmer/{farmerId}")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getFarmerReviews(@PathVariable("farmerId") Long farmerId) {
        return reviewService.getFarmerReviews(farmerId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy đánh giá của gian hàng thành công.", list)));
    }

    @Operation(summary = "Xem tất cả đánh giá của một sản phẩm", description = "Public endpoint. Trả về các đánh giá của sản phẩm.")
    @GetMapping("/reviews/product/{productId}")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getProductReviews(@PathVariable("productId") Long productId) {
        return reviewService.getProductReviews(productId)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy đánh giá của sản phẩm thành công.", list)));
    }

    @Operation(summary = "Nông dân phản hồi đánh giá của khách hàng", description = "Yêu cầu quyền ROLE_FARMER.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> reviewService.replyReview(user.getUserId(), id, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Phản hồi đánh giá thành công.", res)));
    }

    @Operation(summary = "Quản trị viên xem tất cả các đánh giá", description = "Lấy toàn bộ đánh giá bao gồm cả đánh giá đã bị ẩn. Yêu cầu ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/reviews")
    public Mono<ResponseEntity<ApiResponse<List<ReviewResponse>>>> getAllReviewsForAdmin() {
        return reviewService.getAllReviewsForAdmin()
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ đánh giá thành công.", list)));
    }

    @Operation(summary = "Quản trị viên ẩn hoặc hiện đánh giá", description = "Yêu cầu quyền ROLE_ADMIN để kiểm duyệt nội dung vi phạm.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/reviews/{id}/visibility")
    public Mono<ResponseEntity<ApiResponse<ReviewResponse>>> setReviewVisibility(
            @PathVariable("id") Long id,
            @RequestParam("isHidden") boolean isHidden) {
        return reviewService.setReviewVisibility(id, isHidden)
                .map(res -> ResponseEntity.ok(ApiResponse.success(
                        (isHidden ? "Đã ẩn đánh giá khỏi giao diện." : "Đã kích hoạt hiển thị lại đánh giá."), res)));
    }
}

