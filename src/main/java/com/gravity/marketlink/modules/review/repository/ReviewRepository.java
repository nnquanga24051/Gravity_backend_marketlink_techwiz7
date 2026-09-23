package com.gravity.marketlink.modules.review.repository;

import com.gravity.marketlink.modules.review.entity.Review;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ReviewRepository extends R2dbcRepository<Review, Long> {
    Mono<Review> findByOrderId(Long orderId);
    Flux<Review> findByFarmerIdAndIsHiddenFalseOrderByCreatedAtDesc(Long farmerId);
    Flux<Review> findByProductIdAndIsHiddenFalseOrderByCreatedAtDesc(Long productId);
    Flux<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
