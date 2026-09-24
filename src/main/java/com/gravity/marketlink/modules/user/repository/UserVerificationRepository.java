package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.UserVerification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface UserVerificationRepository extends R2dbcRepository<UserVerification, Long> {

    Mono<UserVerification> findTopByUserIdAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(Long userId, String verificationType);

    Mono<UserVerification> findTopByTargetDestinationAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(String targetDestination, String verificationType);

    Mono<UserVerification> findByUserIdAndVerificationTypeAndVerificationCodeAndIsUsedFalse(Long userId, String verificationType, String verificationCode);
}
