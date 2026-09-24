package com.gravity.marketlink.modules.auth.service;

import com.gravity.marketlink.modules.auth.dto.AuthResponse;
import com.gravity.marketlink.modules.auth.dto.LoginRequest;
import com.gravity.marketlink.modules.auth.dto.RegisterRequest;
import com.gravity.marketlink.modules.auth.dto.UserProfileResponse;
import com.gravity.marketlink.modules.auth.entity.Role;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.RoleRepository;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.auth.repository.UserRoleRepository;
import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.CustomerProfileRepository;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import com.gravity.marketlink.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final TransactionalOperator transactionalOperator;
    private final R2dbcEntityTemplate r2dbcEntityTemplate;

    public Mono<AuthResponse> register(RegisterRequest request) {
        String rawRole = request.getRole() != null ? request.getRole().toUpperCase().replace("ROLE_", "") : "CUSTOMER";
        if (!rawRole.equals("FARMER") && !rawRole.equals("CUSTOMER")) {
            return Mono.error(new IllegalArgumentException("Vai trò không hợp lệ: chỉ chấp nhận FARMER hoặc CUSTOMER"));
        }
        final String roleName = rawRole;

        return userRepository.existsByEmail(request.getEmail())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new IllegalArgumentException("Email đã tồn tại: " + request.getEmail()));
                    }

                    return roleRepository.findByRoleName(roleName)
                            .switchIfEmpty(roleRepository.findByRoleName("ROLE_" + roleName))
                            .switchIfEmpty(Mono.error(new IllegalArgumentException("Vai trò không tồn tại trong hệ thống: " + roleName)))
                            .flatMap(role -> {
                                User newUser = User.builder()
                                        .email(request.getEmail())
                                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                                        .fullName(request.getFullName())
                                        .phoneNumber(request.getPhoneNumber())
                                        .isEmailVerified(false)
                                        .isPhoneVerified(false)
                                        .status("ACTIVE")
                                        .kycStatus("UNVERIFIED")
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return userRepository.save(newUser)
                                        .flatMap((User savedUser) ->
                                                userRoleRepository.insertUserRole(savedUser.getUserId(), role.getRoleId())
                                                        .then(createSpecificProfile(savedUser.getUserId(), roleName, request))
                                                        .thenReturn(savedUser)
                                        )
                                        .map((User savedUser) -> {
                                            String authRole = role.getRoleName().startsWith("ROLE_") ? role.getRoleName() : "ROLE_" + role.getRoleName();
                                            List<String> roles = List.of(authRole);
                                            String accessToken = tokenProvider.generateAccessToken(savedUser.getUserId(), savedUser.getEmail(), roles);
                                            String refreshToken = tokenProvider.generateRefreshToken(savedUser.getUserId(), savedUser.getEmail());

                                            return AuthResponse.builder()
                                                    .token(accessToken)
                                                    .accessToken(accessToken)
                                                    .refreshToken(refreshToken)
                                                    .expiresIn(tokenProvider.getJwtExpirationInMs())
                                                    .userId(savedUser.getUserId())
                                                    .email(savedUser.getEmail())
                                                    .fullName(savedUser.getFullName())
                                                    .roles(roles)
                                                    .build();
                                        });
                            });
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<Void> createSpecificProfile(Long userId, String roleName, RegisterRequest request) {
        if ("FARMER".equalsIgnoreCase(roleName) || "ROLE_FARMER".equalsIgnoreCase(roleName)) {
            FarmerProfile profile = FarmerProfile.builder()
                    .farmerId(userId)
                    .stallName(request.getFarmName() != null ? request.getFarmName() : "Nông Trại " + request.getFullName())
                    .farmAddress(request.getFarmAddress() != null ? request.getFarmAddress() : "Chưa cập nhật")
                    .isApproved(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return r2dbcEntityTemplate.insert(profile).then();
        } else {
            CustomerProfile profile = CustomerProfile.builder()
                    .customerId(userId)
                    .defaultAddress(request.getDeliveryAddress() != null ? request.getDeliveryAddress() : "Chưa cập nhật")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return r2dbcEntityTemplate.insert(profile).then();
        }
    }

    public Mono<AuthResponse> login(LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Email hoặc mật khẩu không chính xác")))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                        return Mono.error(new IllegalArgumentException("Email hoặc mật khẩu không chính xác"));
                    }

                    if (!"ACTIVE".equals(user.getStatus())) {
                        return Mono.error(new IllegalArgumentException("Tài khoản của bạn đã bị khóa hoặc tạm ngưng"));
                    }

                    return userRoleRepository.findRolesByUserId(user.getUserId())
                            .map(Role::getRoleName)
                            .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                            .collectList()
                            .map(roles -> {
                                String accessToken = tokenProvider.generateAccessToken(user.getUserId(), user.getEmail(), roles);
                                String refreshToken = tokenProvider.generateRefreshToken(user.getUserId(), user.getEmail());

                                return AuthResponse.builder()
                                        .token(accessToken)
                                        .accessToken(accessToken)
                                        .refreshToken(refreshToken)
                                        .expiresIn(tokenProvider.getJwtExpirationInMs())
                                        .userId(user.getUserId())
                                        .email(user.getEmail())
                                        .fullName(user.getFullName())
                                        .roles(roles)
                                        .build();
                            });
                });
    }

    /**
     * Cấp mới Access Token bằng Refresh Token (Refresh Token Rotation - RTR)
     */
    public Mono<AuthResponse> refreshToken(String oldRefreshToken) {
        if (oldRefreshToken == null || oldRefreshToken.isBlank()) {
            return Mono.error(new IllegalArgumentException("Refresh token không được để trống"));
        }

        if (!tokenProvider.validateRefreshToken(oldRefreshToken)) {
            return Mono.error(new IllegalArgumentException("Refresh token không hợp lệ hoặc đã hết hạn"));
        }

        String email = tokenProvider.getEmailFromToken(oldRefreshToken);

        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Người dùng không tồn tại hoặc đã bị xóa")))
                .flatMap(user -> {
                    if (!"ACTIVE".equals(user.getStatus())) {
                        return Mono.error(new IllegalArgumentException("Tài khoản của bạn đã bị khóa hoặc tạm ngưng"));
                    }

                    return userRoleRepository.findRolesByUserId(user.getUserId())
                            .map(Role::getRoleName)
                            .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                            .collectList()
                            .map(roles -> {
                                // 1. Thu hồi Refresh Token cũ (Blacklist) để chống Replay Attack
                                tokenProvider.blacklistToken(oldRefreshToken);

                                // 2. Phát hành cặp Token mới (RTR)
                                String newAccessToken = tokenProvider.generateAccessToken(user.getUserId(), user.getEmail(), roles);
                                String newRefreshToken = tokenProvider.generateRefreshToken(user.getUserId(), user.getEmail());

                                return AuthResponse.builder()
                                        .token(newAccessToken)
                                        .accessToken(newAccessToken)
                                        .refreshToken(newRefreshToken)
                                        .expiresIn(tokenProvider.getJwtExpirationInMs())
                                        .userId(user.getUserId())
                                        .email(user.getEmail())
                                        .fullName(user.getFullName())
                                        .roles(roles)
                                        .build();
                            });
                });
    }

    public Mono<UserProfileResponse> getCurrentUserProfile(String email) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Người dùng không tồn tại")))
                .flatMap(user ->
                        userRoleRepository.findRolesByUserId(user.getUserId())
                                .map(Role::getRoleName)
                                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                                .collectList()
                                .flatMap(roles -> {
                                    Mono<Object> profileMono;
                                    if (roles.contains("ROLE_FARMER") || roles.contains("FARMER")) {
                                        profileMono = farmerProfileRepository.findByFarmerId(user.getUserId()).cast(Object.class).defaultIfEmpty(new Object());
                                    } else {
                                        profileMono = customerProfileRepository.findByCustomerId(user.getUserId()).cast(Object.class).defaultIfEmpty(new Object());
                                    }

                                    return profileMono.map(profile ->
                                            UserProfileResponse.builder()
                                                    .userId(user.getUserId())
                                                    .email(user.getEmail())
                                                    .fullName(user.getFullName())
                                                    .phoneNumber(user.getPhoneNumber())
                                                    .avatarUrl(user.getAvatarUrl())
                                                    .status(user.getStatus())
                                                    .kycStatus(user.getKycStatus())
                                                    .roles(roles)
                                                    .profileDetails(profile)
                                                    .build()
                                    );
                                })
                );
    }

    /**
     * Đăng xuất người dùng: Thu hồi và đưa token JWT vào danh sách Blacklist
     */
    public Mono<Void> logout(String bearerToken) {
        if (bearerToken != null && !bearerToken.trim().isEmpty()) {
            tokenProvider.blacklistToken(bearerToken);
        }
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
        return Mono.empty();
    }
}
