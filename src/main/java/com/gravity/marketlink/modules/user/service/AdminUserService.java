package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.Role;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.RoleRepository;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.auth.repository.UserRoleRepository;
import com.gravity.marketlink.modules.user.dto.AdminCreateUserRequest;
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
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final VerificationAuditLogRepository verificationAuditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionalOperator transactionalOperator;
    private final R2dbcEntityTemplate r2dbcEntityTemplate;

    public Flux<AdminUserListItemResponse> getUsers(String keyword, String role, String status, String kycStatus) {
        return userRepository.findAll()
                .filter(user -> {
                    if (keyword != null && !keyword.trim().isEmpty()) {
                        String kw = keyword.trim().toLowerCase();
                        boolean matchName = user.getFullName() != null && user.getFullName().toLowerCase().contains(kw);
                        boolean matchEmail = user.getEmail() != null && user.getEmail().toLowerCase().contains(kw);
                        boolean matchPhone = user.getPhoneNumber() != null && user.getPhoneNumber().toLowerCase().contains(kw);
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
                            if (role != null && !role.trim().isEmpty() && !role.trim().equalsIgnoreCase("ALL")) {
                                String cleanRole = role.trim().toUpperCase().replace("ROLE_", "");
                                return roles.stream().anyMatch(r -> {
                                    String cleanR = r.toUpperCase().replace("ROLE_", "");
                                    return cleanR.equalsIgnoreCase(cleanRole);
                                });
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User not found with ID: " + userId)));

        Mono<List<String>> rolesMono = userRoleRepository.findRolesByUserId(userId)
                .map(Role::getRoleName)
                .collectList();

        Mono<FarmerProfile> farmerMono = farmerProfileRepository.findByFarmerId(userId)
                .defaultIfEmpty(new FarmerProfile());

        Mono<CustomerProfile> customerMono = customerProfileRepository.findByCustomerId(userId)
                .defaultIfEmpty(new CustomerProfile());

        Mono<List<VerificationAuditLogResponse>> logsMono = verificationAuditLogRepository.findByTargetUserIdOrderByReviewedAtDesc(userId)
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
                                .adminName("Administrator #" + logItem.getAdminId())
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
    public Mono<AdminUserDetailResponse> updateUserStatus(Long adminId, Long userId, AdminUpdateUserStatusRequest request) {
        String newStatus = request.getStatus().trim().toUpperCase();
        if (!"ACTIVE".equals(newStatus) && !"SUSPENDED".equals(newStatus) && !"PENDING".equals(newStatus)) {
            return Mono.error(new IllegalArgumentException("Invalid status: " + newStatus + ". Choose ACTIVE, SUSPENDED, or PENDING."));
        }

        return userRepository.findById(userId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User not found with ID: " + userId)))
                .flatMap(user -> {
                    Mono<Integer> updateStatusMono = userRepository.updateStatus(userId, newStatus, LocalDateTime.now());

                    Mono<VerificationAuditLog> logMono = Mono.empty();
                    if ("SUSPENDED".equals(newStatus) || (request.getReason() != null && !request.getReason().trim().isEmpty())) {
                        VerificationAuditLog auditLog = VerificationAuditLog.builder()
                                .targetUserId(userId)
                                .adminId(adminId)
                                .action("SUSPENDED".equals(newStatus) ? "SUSPEND" : "APPROVE")
                                .reason(request.getReason() != null ? request.getReason().trim() : "Administrator updated status to " + newStatus)
                                .reviewedAt(LocalDateTime.now())
                                .build();
                        logMono = verificationAuditLogRepository.save(auditLog);
                    }

                    return updateStatusMono.then(logMono).then(getUserDetail(userId));
                });
    }

    /**
     * Admin creates a new user account (CUSTOMER, FARMER, or ADMIN)
     */
    public Mono<AdminUserDetailResponse> createUser(Long adminId, AdminCreateUserRequest request) {
        String rawRole = request.getRole() != null ? request.getRole().trim().toUpperCase().replace("ROLE_", "") : "CUSTOMER";
        if (!rawRole.equals("ADMIN") && !rawRole.equals("FARMER") && !rawRole.equals("CUSTOMER")) {
            return Mono.error(new IllegalArgumentException("Invalid role: only ADMIN, FARMER, or CUSTOMER accepted"));
        }
        final String roleName = rawRole;

        return userRepository.existsByEmail(request.getEmail().trim().toLowerCase())
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(new IllegalArgumentException("Email already registered in system: " + request.getEmail()));
                    }

                    return roleRepository.findByRoleName(roleName)
                            .switchIfEmpty(roleRepository.findByRoleName("ROLE_" + roleName))
                            .switchIfEmpty(Mono.error(new IllegalArgumentException("Role does not exist in system: " + roleName)))
                            .flatMap(role -> {
                                String userStatus = (request.getStatus() != null && !request.getStatus().isBlank())
                                        ? request.getStatus().trim().toUpperCase()
                                        : "ACTIVE";

                                String kycStatus = (request.getKycStatus() != null && !request.getKycStatus().isBlank())
                                        ? request.getKycStatus().trim().toUpperCase()
                                        : (roleName.equals("ADMIN") ? "VERIFIED" : "UNVERIFIED");

                                User newUser = User.builder()
                                        .email(request.getEmail().trim().toLowerCase())
                                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                                        .fullName(request.getFullName().trim())
                                        .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null)
                                        .isEmailVerified(true)
                                        .isPhoneVerified(request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank())
                                        .status(userStatus)
                                        .kycStatus(kycStatus)
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return userRepository.save(newUser)
                                        .flatMap(savedUser ->
                                                userRoleRepository.insertUserRole(savedUser.getUserId(), role.getRoleId())
                                                        .then(createProfileForNewUser(savedUser.getUserId(), roleName, request, kycStatus))
                                                        .then(recordAuditLogIfApplicable(adminId, savedUser.getUserId(), roleName, kycStatus))
                                                        .then(getUserDetail(savedUser.getUserId()))
                                        );
                            });
                })
                .as(transactionalOperator::transactional);
    }

    private Mono<Void> createProfileForNewUser(Long userId, String roleName, AdminCreateUserRequest request, String kycStatus) {
        if ("FARMER".equalsIgnoreCase(roleName)) {
            FarmerProfile profile = FarmerProfile.builder()
                    .farmerId(userId)
                    .stallName(request.getFarmName() != null && !request.getFarmName().isBlank()
                            ? request.getFarmName().trim()
                            : "Farm " + request.getFullName().trim())
                    .farmAddress(request.getFarmAddress() != null && !request.getFarmAddress().isBlank()
                            ? request.getFarmAddress().trim()
                            : (request.getAddress() != null ? request.getAddress().trim() : "Not updated"))
                    .isApproved("VERIFIED".equalsIgnoreCase(kycStatus))
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return r2dbcEntityTemplate.insert(profile).then();
        } else {
            CustomerProfile profile = CustomerProfile.builder()
                    .customerId(userId)
                    .defaultAddress(request.getAddress() != null && !request.getAddress().isBlank()
                            ? request.getAddress().trim()
                            : "Not updated")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            return r2dbcEntityTemplate.insert(profile).then();
        }
    }

    private Mono<Void> recordAuditLogIfApplicable(Long adminId, Long targetUserId, String roleName, String kycStatus) {
        if ("FARMER".equalsIgnoreCase(roleName) && "VERIFIED".equalsIgnoreCase(kycStatus) && adminId != null) {
            VerificationAuditLog logEntry = VerificationAuditLog.builder()
                    .targetUserId(targetUserId)
                    .adminId(adminId)
                    .action("APPROVE")
                    .reason("Administrator directly created Farmer account and granted selling authority")
                    .reviewedAt(LocalDateTime.now())
                    .build();
            return verificationAuditLogRepository.save(logEntry).then();
        }
        return Mono.empty();
    }
}
