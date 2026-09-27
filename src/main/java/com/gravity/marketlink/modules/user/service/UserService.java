package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.modules.auth.dto.UserProfileResponse;
import com.gravity.marketlink.modules.auth.entity.Role;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.auth.repository.UserRoleRepository;
import com.gravity.marketlink.modules.user.dto.ChangePasswordRequest;
import com.gravity.marketlink.modules.user.dto.UpdateAvatarRequest;
import com.gravity.marketlink.modules.user.dto.UpdateProfileRequest;
import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.repository.CustomerProfileRepository;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionalOperator transactionalOperator;
    private final R2dbcEntityTemplate r2dbcEntityTemplate;

    /**
     * Lấy thông tin chi tiết hồ sơ người dùng
     */
    public Mono<UserProfileResponse> getProfile(String email) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy người dùng với email: " + email)))
                .flatMap(this::buildUserProfileResponse);
    }

    /**
     * Cập nhật thông tin hồ sơ người dùng (họ tên, sđt, địa chỉ, thông tin nông trại...)
     */
    public Mono<UserProfileResponse> updateProfile(String email, UpdateProfileRequest request) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy người dùng với email: " + email)))
                .flatMap(user -> {
                    LocalDateTime now = LocalDateTime.now();

                    // Cập nhật thông tin cơ bản của user nếu có truyền vào
                    String newFullName = StringUtils.hasText(request.getFullName()) ? request.getFullName() : user.getFullName();
                    String newPhone = StringUtils.hasText(request.getPhoneNumber()) ? request.getPhoneNumber() : user.getPhoneNumber();

                    Mono<Integer> updateUserMono = userRepository.updateBasicInfo(user.getUserId(), newFullName, newPhone, now);

                    if (StringUtils.hasText(request.getAvatarUrl())) {
                        updateUserMono = updateUserMono.then(userRepository.updateAvatar(user.getUserId(), request.getAvatarUrl().trim(), now));
                    }

                    // Cập nhật chi tiết theo role
                    return updateUserMono
                            .then(userRoleRepository.findRolesByUserId(user.getUserId())
                                    .map(Role::getRoleName)
                                    .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                                    .collectList())
                            .flatMap(roles -> {
                                Mono<Void> updateSpecificProfileMono;
                                if (roles.contains("ROLE_FARMER") || roles.contains("FARMER")) {
                                    updateSpecificProfileMono = updateFarmerDetails(user.getUserId(), request, now);
                                } else {
                                    updateSpecificProfileMono = updateCustomerDetails(user.getUserId(), request, now);
                                }

                                return updateSpecificProfileMono
                                        .then(userRepository.findByEmail(email))
                                        .flatMap(this::buildUserProfileResponse);
                            });
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<Void> updateFarmerDetails(Long farmerId, UpdateProfileRequest request, LocalDateTime now) {
        return farmerProfileRepository.findByFarmerId(farmerId)
                .flatMap(existingProfile -> {
                    String stallName = StringUtils.hasText(request.getStallName()) ? request.getStallName() : existingProfile.getStallName();
                    String bio = request.getBio() != null ? request.getBio() : existingProfile.getBio();
                    String farmAddress = StringUtils.hasText(request.getFarmAddress()) ? request.getFarmAddress() : existingProfile.getFarmAddress();
                    var lat = request.getLatitude() != null ? request.getLatitude() : existingProfile.getLatitude();
                    var lon = request.getLongitude() != null ? request.getLongitude() : existingProfile.getLongitude();

                    return farmerProfileRepository.updateFarmerProfile(farmerId, stallName, bio, farmAddress, lat, lon, now);
                })
                .switchIfEmpty(Mono.defer(() ->
                        r2dbcEntityTemplate.insert(FarmerProfile.builder()
                                .farmerId(farmerId)
                                .stallName(StringUtils.hasText(request.getStallName()) ? request.getStallName() : "Sạp Nông Sản")
                                .bio(request.getBio())
                                .farmAddress(request.getFarmAddress())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .isApproved(false)
                                .createdAt(now)
                                .updatedAt(now)
                                .build()
                        ).map(saved -> 1)
                ))
                .then();
    }

    private Mono<Void> updateCustomerDetails(Long customerId, UpdateProfileRequest request, LocalDateTime now) {
        return customerProfileRepository.findByCustomerId(customerId)
                .flatMap(existingProfile -> {
                    String defaultAddress = StringUtils.hasText(request.getDefaultAddress()) ? request.getDefaultAddress() : existingProfile.getDefaultAddress();
                    var lat = request.getLatitude() != null ? request.getLatitude() : existingProfile.getLatitude();
                    var lon = request.getLongitude() != null ? request.getLongitude() : existingProfile.getLongitude();

                    return customerProfileRepository.updateCustomerProfile(customerId, defaultAddress, lat, lon, now);
                })
                .switchIfEmpty(Mono.defer(() ->
                        r2dbcEntityTemplate.insert(CustomerProfile.builder()
                                .customerId(customerId)
                                .defaultAddress(request.getDefaultAddress())
                                .latitude(request.getLatitude())
                                .longitude(request.getLongitude())
                                .createdAt(now)
                                .updatedAt(now)
                                .build()
                        ).map(saved -> 1)
                ))
                .then();
    }

    /**
     * Cập nhật ảnh đại diện (Avatar)
     */
    public Mono<Map<String, Object>> updateAvatar(String email, UpdateAvatarRequest request) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy người dùng với email: " + email)))
                .flatMap(user -> {
                    LocalDateTime now = LocalDateTime.now();
                    return userRepository.updateAvatar(user.getUserId(), request.getAvatarUrl(), now)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Cập nhật ảnh đại diện thành công",
                                    "avatarUrl", request.getAvatarUrl()
                            ));
                });
    }

    /**
     * Đổi mật khẩu
     */
    public Mono<Map<String, Object>> changePassword(String email, ChangePasswordRequest request) {
        return userRepository.findByEmail(email)
                .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy người dùng với email: " + email)))
                .flatMap(user -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                        return Mono.error(new IllegalArgumentException("Mật khẩu hiện tại không chính xác"));
                    }

                    if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                        return Mono.error(new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu cũ"));
                    }

                    String newHashedPassword = passwordEncoder.encode(request.getNewPassword());
                    LocalDateTime now = LocalDateTime.now();

                    return userRepository.updatePassword(user.getUserId(), newHashedPassword, now)
                            .thenReturn(Map.<String, Object>of(
                                    "status", "SUCCESS",
                                    "message", "Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo."
                            ));
                });
    }

    /**
     * Helper dựng UserProfileResponse kèm roles và profile chi tiết (Customer / Farmer)
     */
    private Mono<UserProfileResponse> buildUserProfileResponse(User user) {
        return userRoleRepository.findRolesByUserId(user.getUserId())
                .map(Role::getRoleName)
                .map(r -> r.startsWith("ROLE_") ? r : "ROLE_" + r)
                .collectList()
                .flatMap(roles -> {
                    Mono<Object> profileMono;
                    if (roles.contains("ROLE_FARMER") || roles.contains("FARMER")) {
                        profileMono = farmerProfileRepository.findByFarmerId(user.getUserId())
                                .cast(Object.class)
                                .defaultIfEmpty(Map.of("message", "Chưa có thông tin trang trại"));
                    } else {
                        profileMono = customerProfileRepository.findByCustomerId(user.getUserId())
                                .cast(Object.class)
                                .defaultIfEmpty(Map.of("message", "Chưa có thông tin giao hàng"));
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
                });
    }
}
