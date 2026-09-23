package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.Favorite;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FavoriteRepository extends R2dbcRepository<Favorite, Long> {
    Flux<Favorite> findByCustomerId(Long customerId);
    Flux<Favorite> findByCustomerIdAndTargetType(Long customerId, String targetType);
    Mono<Boolean> existsByCustomerIdAndTargetTypeAndTargetId(Long customerId, String targetType, Long targetId);
    Mono<Void> deleteByCustomerIdAndTargetTypeAndTargetId(Long customerId, String targetType, Long targetId);
}
