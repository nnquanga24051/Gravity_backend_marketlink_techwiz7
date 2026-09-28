package com.gravity.marketlink.modules.notification.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.notification.dto.NotificationResponse;
import com.gravity.marketlink.modules.notification.service.NotificationService;
import com.gravity.marketlink.security.jwt.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Tag(name = "6. User Notifications", description = "APIs for receiving order status updates, KYC results, and market reminders")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @Operation(summary = "Get list of user notifications", description = "Sorted by newest first.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<NotificationResponse>>>> getMyNotifications(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> notificationService.getUserNotifications(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved notifications successfully.", list)));
    }

    @Operation(summary = "Count unread notifications", description = "Used to display unread badge count in header.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/unread-count")
    public Mono<ResponseEntity<ApiResponse<Map<String, Long>>>> getUnreadCount(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> notificationService.getUnreadCount(user.getUserId()))
                .map(count -> ResponseEntity.ok(ApiResponse.success("Retrieved unread notification count successfully.", Map.of("unreadCount", count))));
    }

    @Operation(summary = "Mark a notification as read", description = "Updates is_read = true status for notification.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/{id}/read")
    public Mono<ResponseEntity<ApiResponse<NotificationResponse>>> markAsRead(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> notificationService.markAsRead(user.getUserId(), id))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Marked notification as read.", res)));
    }

    @Operation(summary = "Mark all notifications as read", description = "Updates all unread notifications to read status.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/read-all")
    public Mono<ResponseEntity<ApiResponse<Void>>> markAllAsRead(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account information not found.")))
                .flatMap(user -> notificationService.markAllAsRead(user.getUserId()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Marked all notifications as read.", null)));
    }

    @Operation(summary = "Real-time SSE Notification Stream", description = "Subscribe to real-time Server-Sent Events push stream. Supports token in Header or ?token= query parameter.")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<NotificationResponse>> streamNotifications(
            Authentication authentication,
            @RequestParam(value = "token", required = false) String queryToken) {
        String email = authentication != null ? authentication.getName() : null;
        if (email == null && queryToken != null && !queryToken.isBlank()) {
            if (tokenProvider.validateToken(queryToken)) {
                email = tokenProvider.getEmailFromToken(queryToken);
            }
        }

        if (email == null) {
            return Flux.just(ServerSentEvent.<NotificationResponse>builder()
                    .event("error")
                    .data(NotificationResponse.builder()
                            .title("Unauthenticated")
                            .message("Please sign in to receive real-time notifications.")
                            .build())
                    .build());
        }

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User account not found.")))
                .flatMapMany(user -> notificationService.subscribe(user.getUserId()));
    }

    @Operation(summary = "Send test push notification", description = "Sends an instant notification to current account to verify sound and pop-up rendering.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/test-push")
    public Mono<ResponseEntity<ApiResponse<NotificationResponse>>> sendTestPush(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> body) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        String title = body != null && body.containsKey("title") ? body.get("title") : "🔔 MarketLink Push Notification";
        String message = body != null && body.containsKey("message") ? body.get("message") : "Real-time push notification system is connected and working properly!";
        String type = body != null && body.containsKey("type") ? body.get("type") : "SYSTEM";

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Account not found.")))
                .flatMap(user -> notificationService.createNotification(user.getUserId(), title, message, type, null))
                .map(notif -> ResponseEntity.ok(ApiResponse.success("Sent test push notification successfully.", notificationService.toResponse(notif))));
    }
}
