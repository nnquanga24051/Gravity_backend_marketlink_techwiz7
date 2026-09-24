package com.gravity.marketlink.modules.review.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.notification.service.NotificationService;
import com.gravity.marketlink.modules.order.entity.Order;
import com.gravity.marketlink.modules.order.repository.OrderItemRepository;
import com.gravity.marketlink.modules.order.repository.OrderRepository;
import com.gravity.marketlink.modules.product.entity.Product;
import com.gravity.marketlink.modules.product.repository.ProductRepository;
import com.gravity.marketlink.modules.review.dto.ReviewCreateRequest;
import com.gravity.marketlink.modules.review.dto.ReviewReplyRequest;
import com.gravity.marketlink.modules.review.dto.ReviewResponse;
import com.gravity.marketlink.modules.review.entity.Review;
import com.gravity.marketlink.modules.review.repository.ReviewRepository;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Mono<ReviewResponse> createReview(Long customerId, ReviewCreateRequest request) {
        return orderRepository.findById(request.getOrderId())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + request.getOrderId())))
                .flatMap(order -> {
                    if (!order.getCustomerId().equals(customerId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không thể đánh giá đơn hàng của người khác."));
                    }

                    if (!"COMPLETED".equalsIgnoreCase(order.getOrderStatus())) {
                        return Mono.error(new IllegalStateException("Chỉ có thể đánh giá sau khi đơn hàng đã hoàn tất (COMPLETED). Trạng thái hiện tại: " + order.getOrderStatus()));
                    }

                    return reviewRepository.findByOrderId(order.getOrderId())
                            .flatMap(existing -> Mono.<ReviewResponse>error(new IllegalStateException("Đơn hàng này đã được đánh giá trước đó.")))
                            .switchIfEmpty(determineProductIdAndSave(order, request));
                });
    }

    private Mono<ReviewResponse> determineProductIdAndSave(Order order, ReviewCreateRequest request) {
        Mono<Long> resolvedProductMono;
        if (request.getProductId() != null) {
            resolvedProductMono = Mono.just(request.getProductId());
        } else {
            resolvedProductMono = orderItemRepository.findByOrderId(order.getOrderId())
                    .next()
                    .map(item -> item.getProductId())
                    .defaultIfEmpty(0L);
        }

        return resolvedProductMono.flatMap(productId -> {
            Review review = Review.builder()
                    .orderId(order.getOrderId())
                    .customerId(order.getCustomerId())
                    .farmerId(order.getFarmerId())
                    .productId(productId > 0 ? productId : null)
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .isHidden(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            return reviewRepository.save(review)
                    .flatMap(saved -> notificationService.createNotification(
                            order.getFarmerId(),
                            "Đánh giá mới cho đơn " + order.getOrderCode(),
                            "Khách hàng vừa đánh giá " + request.getRating() + " sao: \""
                                    + (request.getComment() != null ? request.getComment() : "") + "\"",
                            "SYSTEM",
                            saved.getReviewId())
                            .then(enrichReview(saved)));
        });
    }

    @Transactional
    public Mono<ReviewResponse> replyReview(Long farmerId, Long reviewId, ReviewReplyRequest request) {
        return reviewRepository.findById(reviewId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId)))
                .flatMap(review -> {
                    if (!review.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền phản hồi đánh giá này."));
                    }

                    review.setFarmerReply(request.getFarmerReply());
                    review.setFarmerReplyAt(LocalDateTime.now());

                    return reviewRepository.save(review)
                            .flatMap(saved -> notificationService.createNotification(
                                    saved.getCustomerId(),
                                    "Nông dân đã phản hồi đánh giá của bạn",
                                    "Sạp nông dân vừa gửi phản hồi: \"" + request.getFarmerReply() + "\"",
                                    "SYSTEM",
                                    saved.getReviewId())
                                    .then(enrichReview(saved)));
                });
    }

    public Flux<ReviewResponse> getFarmerReviews(Long farmerId) {
        return reviewRepository.findByFarmerIdAndIsHiddenFalseOrderByCreatedAtDesc(farmerId)
                .flatMap(this::enrichReview);
    }

    public Flux<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdAndIsHiddenFalseOrderByCreatedAtDesc(productId)
                .flatMap(this::enrichReview);
    }

    public Flux<ReviewResponse> getCustomerReviews(Long customerId) {
        return reviewRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .flatMap(this::enrichReview);
    }

    @Transactional
    public Mono<ReviewResponse> setReviewVisibility(Long reviewId, boolean isHidden) {
        return reviewRepository.findById(reviewId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + reviewId)))
                .flatMap(review -> {
                    review.setIsHidden(isHidden);
                    return reviewRepository.save(review);
                })
                .flatMap(this::enrichReview);
    }

    private Mono<ReviewResponse> enrichReview(Review r) {
        Mono<User> customerMono = userRepository.findById(r.getCustomerId())
                .defaultIfEmpty(User.builder().fullName("Khách hàng").avatarUrl("").build());

        Mono<FarmerProfile> farmerProfileMono = farmerProfileRepository.findById(r.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Gian hàng nông dân").build());

        Mono<User> farmerUserMono = userRepository.findById(r.getFarmerId())
                .defaultIfEmpty(User.builder().fullName("Nông dân").build());

        Mono<String> productNameMono = (r.getProductId() != null)
                ? productRepository.findById(r.getProductId()).map(Product::getName).defaultIfEmpty("")
                : Mono.just("");

        return Mono.zip(customerMono, farmerProfileMono, farmerUserMono, productNameMono)
                .map(tuple -> {
                    User customer = tuple.getT1();
                    FarmerProfile farmerProfile = tuple.getT2();
                    User farmerUser = tuple.getT3();
                    String prodName = tuple.getT4();

                    return ReviewResponse.builder()
                            .reviewId(r.getReviewId())
                            .orderId(r.getOrderId())
                            .customerId(r.getCustomerId())
                            .customerName(customer.getFullName())
                            .customerAvatar(customer.getAvatarUrl())
                            .farmerId(r.getFarmerId())
                            .farmerName(farmerUser.getFullName())
                            .stallName(farmerProfile.getStallName())
                            .productId(r.getProductId())
                            .productName(prodName)
                            .rating(r.getRating())
                            .comment(r.getComment())
                            .farmerReply(r.getFarmerReply())
                            .farmerReplyAt(r.getFarmerReplyAt())
                            .isHidden(r.getIsHidden())
                            .createdAt(r.getCreatedAt())
                            .build();
                });
    }
}
