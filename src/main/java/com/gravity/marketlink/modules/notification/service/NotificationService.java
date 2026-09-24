package com.gravity.marketlink.modules.notification.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.notification.dto.NotificationResponse;
import com.gravity.marketlink.modules.notification.entity.Notification;
import com.gravity.marketlink.modules.notification.repository.NotificationRepository;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Flux<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .map(this::toResponse);
    }

    public Mono<Long> getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Mono<NotificationResponse> markAsRead(Long userId, Long notificationId) {
        return notificationRepository.findById(notificationId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông báo với ID: " + notificationId)))
                .flatMap(notif -> {
                    if (!notif.getUserId().equals(userId)) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền chỉnh sửa thông báo này."));
                    }
                    notif.setIsRead(true);
                    return notificationRepository.save(notif);
                })
                .map(this::toResponse);
    }

    @Transactional
    public Mono<Void> markAllAsRead(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .flatMap(notif -> {
                    notif.setIsRead(true);
                    return notificationRepository.save(notif);
                })
                .then();
    }

    @Transactional
    public Mono<Notification> createNotification(Long userId, String title, String message, String type, Long referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return notificationRepository.save(notification)
                .doOnSuccess(saved -> log.info("Notification created for user {}: {}", userId, title));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
