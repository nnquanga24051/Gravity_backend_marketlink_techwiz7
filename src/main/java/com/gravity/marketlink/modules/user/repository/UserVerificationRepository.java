package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.UserVerification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserVerificationRepository extends R2dbcRepository<UserVerification, Long> {
    Mono<UserVerification> findByUserIdAndVerificationTypeAndCodeAndIsUsedFalse(Long userId, String type, String code);
    Mono<UserVerification> findTopByUserIdAndVerificationTypeOrderByCreatedAtDesc(Long userId, String type);
}
