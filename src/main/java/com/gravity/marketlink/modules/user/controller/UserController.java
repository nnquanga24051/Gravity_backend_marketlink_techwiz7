package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.modules.auth.dto.UserProfileResponse;
import com.gravity.marketlink.modules.user.dto.ChangePasswordRequest;
import com.gravity.marketlink.modules.user.dto.UpdateAvatarRequest;
import com.gravity.marketlink.modules.user.dto.UpdateProfileRequest;
import com.gravity.marketlink.modules.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@Tag(name = "4. Quản lý Hồ sơ & Người dùng (User Profile)", description = "Các API xem thông tin cá nhân, cập nhật hồ sơ, đổi mật khẩu và đổi avatar")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Xem hồ sơ cá nhân", description = "Lấy toàn bộ thông tin tài khoản và thông tin chi tiết (Farmer/Customer) của người dùng đang đăng nhập.")
    @GetMapping
    public Mono<ResponseEntity<UserProfileResponse>> getMyProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return userService.getProfile(authentication.getName())
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Cập nhật thông tin hồ sơ", description = "Cập nhật họ tên, số điện thoại, địa chỉ nhận hàng (Customer) hoặc tên sạp/địa chỉ trang trại (Farmer).")
    @PutMapping
    public Mono<ResponseEntity<UserProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return userService.updateProfile(authentication.getName(), request)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Cập nhật ảnh đại diện (Avatar)", description = "Cập nhật link avatarUrl cho tài khoản người dùng.")
    @PatchMapping("/avatar")
    public Mono<ResponseEntity<Map<String, Object>>> updateAvatar(
            Authentication authentication,
            @Valid @RequestBody UpdateAvatarRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return userService.updateAvatar(authentication.getName(), request)
                .map(ResponseEntity::ok);
    }

    @Operation(summary = "Đổi mật khẩu", description = "Xác thực mật khẩu hiện tại và cập nhật mật khẩu mới.")
    @PutMapping("/change-password")
    public Mono<ResponseEntity<Map<String, Object>>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return userService.changePassword(authentication.getName(), request)
                .map(ResponseEntity::ok);
    }
}
