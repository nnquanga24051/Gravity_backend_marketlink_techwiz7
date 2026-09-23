package com.gravity.marketlink.modules.notification.repository;

import com.gravity.marketlink.modules.notification.entity.SystemAnnouncement;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;

@Repository
public interface SystemAnnouncementRepository extends R2dbcRepository<SystemAnnouncement, Long> {
    Flux<SystemAnnouncement> findByIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDateTime now1, LocalDateTime now2);
    Flux<SystemAnnouncement> findByIsActiveTrue();
}
