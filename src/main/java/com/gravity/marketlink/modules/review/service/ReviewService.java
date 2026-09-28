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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Order not found with ID: " + request.getOrderId())))
                .flatMap(order -> {
                    if (!order.getCustomerId().equals(customerId)) {
                        return Mono.error(new IllegalArgumentException("You cannot review another customer's order."));
                    }

                    if (!"COMPLETED".equalsIgnoreCase(order.getOrderStatus())) {
                        return Mono.error(new IllegalStateException("You can only review after order is completed (COMPLETED). Current status: " + order.getOrderStatus()));
                    }

                    return reviewRepository.findByOrderId(order.getOrderId())
                            .flatMap(existing -> Mono.<ReviewResponse>error(new IllegalStateException("This order has already been reviewed.")))
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
                            "New review for order " + order.getOrderCode(),
                            "A customer just rated " + request.getRating() + " sao: \""
                                    + (request.getComment() != null ? request.getComment() : "") + "\"",
                            "SYSTEM",
                            saved.getReviewId())
                            .then(enrichReview(saved)));
        });
    }

    @Transactional
    public Mono<ReviewResponse> replyReview(Long farmerId, Long reviewId, ReviewReplyRequest request) {
        return reviewRepository.findById(reviewId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Review not found with ID: " + reviewId)))
                .flatMap(review -> {
                    if (!review.getFarmerId().equals(farmerId)) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to reply to this review."));
                    }

                    review.setFarmerReply(request.getFarmerReply());
                    review.setFarmerReplyAt(LocalDateTime.now());

                    return reviewRepository.save(review)
                            .flatMap(saved -> notificationService.createNotification(
                                    saved.getCustomerId(),
                                    "Farmer replied to your review",
                                    "Farmer responded: \"" + request.getFarmerReply() + "\"",
                                    "SYSTEM",
                                    saved.getReviewId())
                                    .then(enrichReview(saved)));
                });
    }

    public Flux<ReviewResponse> getFarmerReviews(Long farmerId, String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return reviewRepository.findByFarmerIdAndIsHiddenFalseOrderByCreatedAtDesc(farmerId)
                .flatMap(this::enrichReview)
                .filter(r -> kw.isEmpty()
                        || (r.getComment() != null && r.getComment().toLowerCase().contains(kw))
                        || (r.getCustomerName() != null && r.getCustomerName().toLowerCase().contains(kw))
                        || (r.getProductName() != null && r.getProductName().toLowerCase().contains(kw))
                        || (r.getFarmerReply() != null && r.getFarmerReply().toLowerCase().contains(kw)));
    }

    public Flux<ReviewResponse> getFarmerReviews(Long farmerId) {
        return getFarmerReviews(farmerId, null);
    }

    public Flux<ReviewResponse> getProductReviews(Long productId) {
        return reviewRepository.findByProductIdAndIsHiddenFalseOrderByCreatedAtDesc(productId)
                .flatMap(this::enrichReview);
    }

    public Flux<ReviewResponse> getCustomerReviews(Long customerId, String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return reviewRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .flatMap(this::enrichReview)
                .filter(r -> kw.isEmpty()
                        || (r.getComment() != null && r.getComment().toLowerCase().contains(kw))
                        || (r.getProductName() != null && r.getProductName().toLowerCase().contains(kw))
                        || (r.getStallName() != null && r.getStallName().toLowerCase().contains(kw)));
    }

    public Flux<ReviewResponse> getCustomerReviews(Long customerId) {
        return getCustomerReviews(customerId, null);
    }

    public Flux<ReviewResponse> getAllReviewsForAdmin(String keyword, String filter) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .flatMap(this::enrichReview)
                .filter(r -> {
                    if (filter != null && !filter.isBlank() && !"ALL".equalsIgnoreCase(filter.trim())) {
                        String f = filter.trim().toUpperCase();
                        if ("LOW_RATING".equals(f) && (r.getRating() == null || r.getRating() > 2)) return false;
                        if ("HIDDEN".equals(f) && !Boolean.TRUE.equals(r.getIsHidden())) return false;
                        if ("VISIBLE".equals(f) && Boolean.TRUE.equals(r.getIsHidden())) return false;
                    }
                    if (!kw.isEmpty()) {
                        boolean matchComment = r.getComment() != null && r.getComment().toLowerCase().contains(kw);
                        boolean matchCust = r.getCustomerName() != null && r.getCustomerName().toLowerCase().contains(kw);
                        boolean matchStall = r.getStallName() != null && r.getStallName().toLowerCase().contains(kw);
                        boolean matchProd = r.getProductName() != null && r.getProductName().toLowerCase().contains(kw);
                        boolean matchReply = r.getFarmerReply() != null && r.getFarmerReply().toLowerCase().contains(kw);
                        if (!matchComment && !matchCust && !matchStall && !matchProd && !matchReply) return false;
                    }
                    return true;
                });
    }

    public Flux<ReviewResponse> getAllReviewsForAdmin() {
        return getAllReviewsForAdmin(null, null);
    }

    @Transactional
    public Mono<ReviewResponse> setReviewVisibility(Long reviewId, boolean isHidden) {
        return reviewRepository.findById(reviewId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Review not found with ID: " + reviewId)))
                .flatMap(review -> {
                    review.setIsHidden(isHidden);
                    return reviewRepository.save(review);
                })
                .flatMap(this::enrichReview);
    }

    private Mono<ReviewResponse> enrichReview(Review r) {
        Mono<User> customerMono = userRepository.findById(r.getCustomerId())
                .defaultIfEmpty(User.builder().fullName("Customer").avatarUrl("").build());

        Mono<FarmerProfile> farmerProfileMono = farmerProfileRepository.findById(r.getFarmerId())
                .defaultIfEmpty(FarmerProfile.builder().stallName("Farmer Stall").build());

        Mono<User> farmerUserMono = userRepository.findById(r.getFarmerId())
                .defaultIfEmpty(User.builder().fullName("Farmer").build());

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
