package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.VerificationAuditLog;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface VerificationAuditLogRepository extends R2dbcRepository<VerificationAuditLog, Long> {

    Flux<VerificationAuditLog> findByTargetUserIdOrderByReviewedAtDesc(Long targetUserId);

    Flux<VerificationAuditLog> findByAdminIdOrderByReviewedAtDesc(Long adminId);

    Flux<VerificationAuditLog> findAllByOrderByReviewedAtDesc();
}
