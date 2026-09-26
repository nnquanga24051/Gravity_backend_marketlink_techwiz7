package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.Role;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.auth.repository.UserRoleRepository;
import com.gravity.marketlink.modules.user.dto.AdminUpdateUserStatusRequest;
import com.gravity.marketlink.modules.user.dto.AdminUserDetailResponse;
import com.gravity.marketlink.modules.user.dto.AdminUserListItemResponse;
import com.gravity.marketlink.modules.user.dto.VerificationAuditLogResponse;
import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.entity.VerificationAuditLog;
import com.gravity.marketlink.modules.user.repository.CustomerProfileRepository;
import com.gravity.marketlink.modules.user.repository.FarmerProfileRepository;
import com.gravity.marketlink.modules.user.repository.VerificationAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final VerificationAuditLogRepository verificationAuditLogRepository;

    public Flux<AdminUserListItemResponse> getUsers(String keyword, String role, String status, String kycStatus) {
        return userRepository.findAll()
                .filter(user -> {
                    if (keyword != null && !keyword.trim().isEmpty()) {
                        String kw = keyword.trim().toLowerCase();
                        boolean matchName = user.getFullName() != null && user.getFullName().toLowerCase().contains(kw);
                        boolean matchEmail = user.getEmail() != null && user.getEmail().toLowerCase().contains(kw);
                        boolean matchPhone = user.getPhoneNumber() != null
                                && user.getPhoneNumber().toLowerCase().contains(kw);
                        if (!matchName && !matchEmail && !matchPhone) {
                            return false;
                        }
                    }
                    if (status != null && !status.trim().isEmpty()) {
                        if (!status.trim().equalsIgnoreCase(user.getStatus())) {
                            return false;
                        }
                    }
                    if (kycStatus != null && !kycStatus.trim().isEmpty()) {
                        if (!kycStatus.trim().equalsIgnoreCase(user.getKycStatus())) {
                            return false;
                        }
                    }
                    return true;
                })
                .flatMap(user -> userRoleRepository.findRolesByUserId(user.getUserId())
                        .map(Role::getRoleName)
                        .collectList()
                        .filter(roles -> {
                            if (role != null && !role.trim().isEmpty()) {
                                String cleanRole = role.trim().toUpperCase();
                                return roles.stream().anyMatch(
                                        r -> r.equalsIgnoreCase(cleanRole) || r.equalsIgnoreCase("ROLE_" + cleanRole));
                            }
                            return true;
                        })
                        .map(roles -> AdminUserListItemResponse.builder()
                                .userId(user.getUserId())
                                .email(user.getEmail())
                                .fullName(user.getFullName())
                                .phoneNumber(user.getPhoneNumber())
                                .avatarUrl(user.getAvatarUrl())
                                .status(user.getStatus())
                                .kycStatus(user.getKycStatus())
                                .roles(roles)
                                .isEmailVerified(user.getIsEmailVerified())
                                .isPhoneVerified(user.getIsPhoneVerified())
                                .createdAt(user.getCreatedAt())
                                .build()));
    }

    public Mono<AdminUserDetailResponse> getUserDetail(Long userId) {
        Mono<User> userMono = userRepository.findById(userId)
                .switchIfEmpty(
                        Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId)));

        Mono<List<String>> rolesMono = userRoleRepository.findRolesByUserId(userId)
                .map(Role::getRoleName)
                .collectList();

        Mono<FarmerProfile> farmerMono = farmerProfileRepository.findByFarmerId(userId)
                .defaultIfEmpty(new FarmerProfile());

        Mono<CustomerProfile> customerMono = customerProfileRepository.findByCustomerId(userId)
                .defaultIfEmpty(new CustomerProfile());

        Mono<List<VerificationAuditLogResponse>> logsMono = verificationAuditLogRepository
                .findByTargetUserIdOrderByReviewedAtDesc(userId)
                .flatMap(logItem -> userRepository.findById(logItem.getAdminId())
                        .map(admin -> VerificationAuditLogResponse.builder()
                                .logId(logItem.getLogId())
                                .targetUserId(logItem.getTargetUserId())
                                .adminId(logItem.getAdminId())
                                .adminName(admin.getFullName())
                                .action(logItem.getAction())
                                .reason(logItem.getReason())
                                .reviewedAt(logItem.getReviewedAt())
                                .build())
                        .defaultIfEmpty(VerificationAuditLogResponse.builder()
                                .logId(logItem.getLogId())
                                .targetUserId(logItem.getTargetUserId())
                                .adminId(logItem.getAdminId())
                                .adminName("Quản trị viên #" + logItem.getAdminId())
                                .action(logItem.getAction())
                                .reason(logItem.getReason())
                                .reviewedAt(logItem.getReviewedAt())
                                .build()))
                .collectList();

        return Mono.zip(userMono, rolesMono, farmerMono, customerMono)
                .zipWith(logsMono)
                .map(tuple -> {
                    User user = tuple.getT1().getT1();
                    List<String> roles = tuple.getT1().getT2();
                    FarmerProfile farmer = tuple.getT1().getT3();
                    CustomerProfile customer = tuple.getT1().getT4();
                    List<VerificationAuditLogResponse> logs = tuple.getT2();

                    return AdminUserDetailResponse.builder()
                            .userId(user.getUserId())
                            .email(user.getEmail())
                            .fullName(user.getFullName())
                            .phoneNumber(user.getPhoneNumber())
                            .avatarUrl(user.getAvatarUrl())
                            .status(user.getStatus())
                            .kycStatus(user.getKycStatus())
                            .roles(roles)
                            .isEmailVerified(user.getIsEmailVerified())
                            .isPhoneVerified(user.getIsPhoneVerified())
                            .createdAt(user.getCreatedAt())
                            .updatedAt(user.getUpdatedAt())
                            // Farmer specifics
                            .stallName(farmer.getStallName())
                            .bio(farmer.getBio())
                            .farmAddress(farmer.getFarmAddress())
                            .latitude(farmer.getLatitude())
                            .longitude(farmer.getLongitude())
                            .isApproved(farmer.getIsApproved())
                            // Customer specifics
                            .defaultAddress(customer.getDefaultAddress())
                            .familyAccountId(customer.getFamilyAccountId())
                            // Audit logs
                            .auditLogs(logs)
                            .build();
                });
    }

    @Transactional
    public Mono<AdminUserDetailResponse> updateUserStatus(Long adminId, Long userId,
            AdminUpdateUserStatusRequest request) {
        String newStatus = request.getStatus().trim().toUpperCase();
        if (!"ACTIVE".equals(newStatus) && !"SUSPENDED".equals(newStatus) && !"PENDING".equals(newStatus)) {
            return Mono.error(new IllegalArgumentException(
                    "Trạng thái không hợp lệ: " + newStatus + ". Chọn ACTIVE, SUSPENDED hoặc PENDING."));
        }

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId)))
                .flatMap(user -> {
                    Mono<Integer> updateStatusMono = userRepository.updateStatus(userId, newStatus,
                            LocalDateTime.now());

                    Mono<VerificationAuditLog> logMono = Mono.empty();
                    if ("SUSPENDED".equals(newStatus)
                            || (request.getReason() != null && !request.getReason().trim().isEmpty())) {
                        VerificationAuditLog auditLog = VerificationAuditLog.builder()
                                .targetUserId(userId)
                                .adminId(adminId)
                                .action("SUSPENDED".equals(newStatus) ? "SUSPEND" : "APPROVE")
                                .reason(request.getReason() != null ? request.getReason().trim()
                                        : "Quản trị viên cập nhật trạng thái sang " + newStatus)
                                .reviewedAt(LocalDateTime.now())
                                .build();
                        logMono = verificationAuditLogRepository.save(auditLog);
                    }

                    return updateStatusMono.then(logMono).then(getUserDetail(userId));
                });
    }
}
