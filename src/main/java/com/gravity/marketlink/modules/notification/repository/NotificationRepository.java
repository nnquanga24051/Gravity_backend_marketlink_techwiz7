package com.gravity.marketlink.modules.notification.repository;

import com.gravity.marketlink.modules.notification.entity.Notification;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, Long> {
    Flux<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Flux<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
    Mono<Long> countByUserIdAndIsReadFalse(Long userId);
}
