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

@Tag(name = "6. Thông báo người dùng (Notifications)", description = "Các API nhận thông báo cập nhật đơn hàng, kết quả KYC, nhắc nhở họp chợ")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    @Operation(summary = "Lấy danh sách thông báo của tài khoản", description = "Sắp xếp theo thứ tự mới nhất.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<NotificationResponse>>>> getMyNotifications(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> notificationService.getUserNotifications(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách thông báo thành công.", list)));
    }

    @Operation(summary = "Đếm số lượng thông báo chưa đọc", description = "Dùng để hiển thị badge số lượng thông báo trên header.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/unread-count")
    public Mono<ResponseEntity<ApiResponse<Map<String, Long>>>> getUnreadCount(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> notificationService.getUnreadCount(user.getUserId()))
                .map(count -> ResponseEntity.ok(ApiResponse.success("Lấy số lượng thông báo chưa đọc thành công.", Map.of("unreadCount", count))));
    }

    @Operation(summary = "Đánh dấu một thông báo là đã đọc", description = "Cập nhật trạng thái is_read = true cho thông báo.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/{id}/read")
    public Mono<ResponseEntity<ApiResponse<NotificationResponse>>> markAsRead(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> notificationService.markAsRead(user.getUserId(), id))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Đã đánh dấu thông báo là đã đọc.", res)));
    }

    @Operation(summary = "Đánh dấu tất cả thông báo là đã đọc", description = "Cập nhật tất cả thông báo chưa đọc thành đã đọc.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PatchMapping("/read-all")
    public Mono<ResponseEntity<ApiResponse<Void>>> markAllAsRead(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản.")))
                .flatMap(user -> notificationService.markAllAsRead(user.getUserId()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Đã đánh dấu tất cả thông báo là đã đọc.", null)));
    }

    @Operation(summary = "Luồng thông báo đẩy thời gian thực (SSE Push Stream)", description = "Đăng ký nhận luồng SSE thông báo đẩy tức thì. Hỗ trợ truyền Token qua Header hoặc param ?token= để dùng với EventSource trình duyệt.")
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
                            .title("Chưa xác thực")
                            .message("Vui lòng đăng nhập để nhận thông báo đẩy.")
                            .build())
                    .build());
        }

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy tài khoản người dùng.")))
                .flatMapMany(user -> notificationService.subscribe(user.getUserId()));
    }

    @Operation(summary = "Bắn thử thông báo đẩy kiểm thử (Test Push Notification)", description = "Gửi một thông báo tức thì đến tài khoản hiện tại để kiểm tra âm thanh và hiển thị pop-up thông báo.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping("/test-push")
    public Mono<ResponseEntity<ApiResponse<NotificationResponse>>> sendTestPush(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> body) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        String title = body != null && body.containsKey("title") ? body.get("title") : "🔔 Thông báo đẩy MarketLink";
        String message = body != null && body.containsKey("message") ? body.get("message") : "Hệ thống thông báo đẩy thời gian thực đang kết nối và hoạt động tốt!";
        String type = body != null && body.containsKey("type") ? body.get("type") : "SYSTEM";

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy tài khoản.")))
                .flatMap(user -> notificationService.createNotification(user.getUserId(), title, message, type, null))
                .map(notif -> ResponseEntity.ok(ApiResponse.success("Đã bắn thông báo đẩy kiểm thử thành công.", notificationService.toResponse(notif))));
    }
}
