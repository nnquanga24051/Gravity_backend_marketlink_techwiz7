package com.gravity.marketlink.modules.notification.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.notification.dto.NotificationResponse;
import com.gravity.marketlink.modules.notification.entity.Notification;
import com.gravity.marketlink.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Quản lý các kênh phát thông báo đẩy thời gian thực theo userId
    private final Map<Long, Sinks.Many<ServerSentEvent<NotificationResponse>>> userSinks = new ConcurrentHashMap<>();

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
                .doOnSuccess(saved -> {
                    log.info("Notification created for user {}: {}", userId, title);
                    emitPushNotification(saved);
                });
    }

    /**
     * Bắn thông báo đẩy thời gian thực (SSE) tới client đang kết nối
     */
    public void emitPushNotification(Notification notification) {
        if (notification == null || notification.getUserId() == null) return;
        Sinks.Many<ServerSentEvent<NotificationResponse>> sink = userSinks.get(notification.getUserId());
        if (sink != null) {
            NotificationResponse resp = toResponse(notification);
            ServerSentEvent<NotificationResponse> event = ServerSentEvent.<NotificationResponse>builder()
                    .id(String.valueOf(notification.getNotificationId()))
                    .event("notification")
                    .data(resp)
                    .build();
            Sinks.EmitResult result = sink.tryEmitNext(event);
            log.info("Đã bắn thông báo đẩy SSE tới user {}: result={}", notification.getUserId(), result);
        } else {
            log.debug("User {} hiện không có kết nối SSE trực tiếp", notification.getUserId());
        }
    }

    /**
     * Đăng ký nhận luồng thông báo đẩy thời gian thực (SSE Stream)
     */
    public Flux<ServerSentEvent<NotificationResponse>> subscribe(Long userId) {
        Sinks.Many<ServerSentEvent<NotificationResponse>> sink = userSinks.computeIfAbsent(
                userId,
                k -> Sinks.many().multicast().onBackpressureBuffer()
        );

        // Sự kiện khởi tạo kết nối thành công
        ServerSentEvent<NotificationResponse> initEvent = ServerSentEvent.<NotificationResponse>builder()
                .event("connected")
                .data(NotificationResponse.builder()
                        .userId(userId)
                        .title("Kết nối thông báo đẩy")
                        .message("Hệ thống thông báo thời gian thực MarketLink đã sẵn sàng!")
                        .type("SYSTEM")
                        .createdAt(LocalDateTime.now())
                        .build())
                .build();

        // Heartbeat giữ kết nối 25 giây/lần tránh bị timeout Nginx / Proxy
        Flux<ServerSentEvent<NotificationResponse>> heartbeats = Flux.interval(Duration.ofSeconds(25))
                .map(i -> ServerSentEvent.<NotificationResponse>builder()
                        .event("heartbeat")
                        .comment("ping")
                        .build());

        return Flux.merge(Mono.just(initEvent), sink.asFlux(), heartbeats)
                .doOnCancel(() -> log.debug("User {} đã đóng kết nối thông báo đẩy SSE", userId));
    }

    public NotificationResponse toResponse(Notification n) {
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
