package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.AdminUpdateUserStatusRequest;
import com.gravity.marketlink.modules.user.dto.AdminUserDetailResponse;
import com.gravity.marketlink.modules.user.dto.AdminUserListItemResponse;
import com.gravity.marketlink.modules.user.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "7. Quản trị viên - Quản lý Người dùng (Admin Users)", description = "Các API tra cứu danh sách người dùng, xem chi tiết và khóa/kích hoạt tài khoản người dùng")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository userRepository;

    @Operation(summary = "Tra cứu danh sách người dùng", description = "Tìm kiếm người dùng theo từ khóa (tên, email, số điện thoại), vai trò (ADMIN, FARMER, CUSTOMER), trạng thái hoạt động (ACTIVE, SUSPENDED) hoặc trạng thái KYC.")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<AdminUserListItemResponse>>>> getUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "kycStatus", required = false) String kycStatus) {
        return adminUserService.getUsers(keyword, role, status, kycStatus)
                .collectList()
                .map(users -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công.", users)));
    }

    @Operation(summary = "Xem thông tin chi tiết người dùng", description = "Lấy toàn bộ thông tin chi tiết hồ sơ tài khoản (bao gồm thông tin Nông dân / Khách hàng và nhật ký kiểm duyệt).")
    @GetMapping("/{userId}")
    public Mono<ResponseEntity<ApiResponse<AdminUserDetailResponse>>> getUserDetail(
            @PathVariable("userId") Long userId) {
        return adminUserService.getUserDetail(userId)
                .map(detail -> ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết người dùng thành công.", detail)));
    }

    @Operation(summary = "Khóa hoặc Mở khóa tài khoản người dùng", description = "Cập nhật trạng thái người dùng (SUSPENDED để tạm khóa, ACTIVE để kích hoạt lại). Nếu khóa tài khoản, lý do sẽ được ghi vào nhật ký kiểm duyệt.")
    @PatchMapping("/{userId}/status")
    public Mono<ResponseEntity<ApiResponse<AdminUserDetailResponse>>> updateUserStatus(
            Authentication authentication,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUpdateUserStatusRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin quản trị viên.")))
                .flatMap(admin -> adminUserService.updateUserStatus(admin.getUserId(), userId, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công.", res)));
    }
}
