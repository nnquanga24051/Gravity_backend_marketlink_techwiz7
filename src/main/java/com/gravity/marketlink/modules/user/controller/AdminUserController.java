package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.AdminCreateUserRequest;
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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "7. Admin User Management", description = "APIs for browsing users, viewing profile details, and suspending/activating accounts")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository userRepository;

    @Operation(summary = "Browse and search user list", description = "Search users by keyword (name, email, phone), role (ADMIN, FARMER, CUSTOMER), status (ACTIVE, SUSPENDED), or KYC status.")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<AdminUserListItemResponse>>>> getUsers(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "kycStatus", required = false) String kycStatus) {
        return adminUserService.getUsers(keyword, role, status, kycStatus)
                .collectList()
                .map(users -> ResponseEntity.ok(ApiResponse.success("Retrieved user list successfully.", users)));
    }

    @Operation(summary = "View user profile details", description = "Retrieves full account details (including Farmer/Customer profile and moderation audit logs).")
    @GetMapping("/{userId}")
    public Mono<ResponseEntity<ApiResponse<AdminUserDetailResponse>>> getUserDetail(
            @PathVariable("userId") Long userId) {
        return adminUserService.getUserDetail(userId)
                .map(detail -> ResponseEntity.ok(ApiResponse.success("Retrieved user details successfully.", detail)));
    }

    @Operation(summary = "Suspend or activate user account", description = "Updates user status (SUSPENDED to lock, ACTIVE to reactivate). Audit notes recorded in log.")
    @PatchMapping("/{userId}/status")
    public Mono<ResponseEntity<ApiResponse<AdminUserDetailResponse>>> updateUserStatus(
            Authentication authentication,
            @PathVariable("userId") Long userId,
            @Valid @RequestBody AdminUpdateUserStatusRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Administrator information not found.")))
                .flatMap(admin -> adminUserService.updateUserStatus(admin.getUserId(), userId, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Updated user status successfully.", res)));
    }

    @Operation(summary = "Admin creates new user account", description = "Allows Administrator to create new Farmer, Customer, or Admin accounts with initial credentials.")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<AdminUserDetailResponse>>> createUser(
            Authentication authentication,
            @Valid @RequestBody AdminCreateUserRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Administrator information not found.")))
                .flatMap(admin -> adminUserService.createUser(admin.getUserId(), request))
                .map(createdUser -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Created new user successfully.", createdUser)));
    }
}
