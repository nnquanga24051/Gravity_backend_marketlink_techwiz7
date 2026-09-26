package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.*;
import com.gravity.marketlink.modules.user.entity.FarmerKycDocument;
import com.gravity.marketlink.modules.user.entity.FarmerProfile;
import com.gravity.marketlink.modules.user.entity.VerificationAuditLog;
import com.gravity.marketlink.modules.user.repository.FarmerKycDocumentRepository;
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
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class KycService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final FarmerKycDocumentRepository farmerKycDocumentRepository;
    private final VerificationAuditLogRepository verificationAuditLogRepository;

    @Transactional
    public Mono<FarmerKycStatusResponse> submitKyc(Long farmerId, FarmerKycSubmitRequest request) {
        if (request == null || request.getDocuments() == null || request.getDocuments().isEmpty()) {
            return Mono.error(new IllegalArgumentException("Danh sách tài liệu KYC không được để trống."));
        }

        List<FarmerKycItemRequest> docs = request.getDocuments();

        // 1. Đảm bảo FarmerProfile tồn tại (tự động tạo nếu chưa có)
        return farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.defer(() -> {
                    FarmerProfile defaultProfile = FarmerProfile.builder()
                            .farmerId(farmerId)
                            .stallName("Nông Trại")
                            .farmAddress("Chưa cập nhật")
                            .isApproved(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return farmerProfileRepository.save(defaultProfile);
                }))
                .flatMap(profile -> {
                    // 2. Xóa các tài liệu cũ (nếu có) và nạp danh sách tài liệu mới
                    return farmerKycDocumentRepository.deleteByFarmerId(farmerId)
                            .thenMany(Flux.fromIterable(docs))
                            .flatMap(item -> farmerKycDocumentRepository.save(
                                    FarmerKycDocument.builder()
                                            .farmerId(farmerId)
                                            .documentUrl(item.getDocumentUrl())
                                            .documentNumber(item.getDocumentNumber())
                                            .issuedDate(item.getIssuedDate())
                                            .expiryDate(item.getExpiryDate())
                                            .createdAt(LocalDateTime.now())
                                            .build()
                            ))
                            .then(userRepository.updateKycStatus(farmerId, "PENDING", LocalDateTime.now()))
                            .then(getFarmerKycStatus(farmerId));
                });
    }

    public Mono<FarmerKycStatusResponse> getFarmerKycStatus(Long farmerId) {
        Mono<User> userMono = userRepository.findById(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + farmerId)));

        Mono<FarmerProfile> profileMono = farmerProfileRepository.findByFarmerId(farmerId)
                .defaultIfEmpty(FarmerProfile.builder()
                        .farmerId(farmerId)
                        .stallName("Nông Trại")
                        .farmAddress("Chưa cập nhật")
                        .isApproved(false)
                        .build());

        Mono<List<FarmerKycDocumentResponse>> docsMono = farmerKycDocumentRepository.findByFarmerId(farmerId)
                .map(this::mapToDocResponse)
                .collectList();

        Mono<List<VerificationAuditLogResponse>> logsMono = verificationAuditLogRepository.findByTargetUserIdOrderByReviewedAtDesc(farmerId)
                .flatMap(logItem -> userRepository.findById(logItem.getAdminId())
                        .map(admin -> mapToAuditLogResponse(logItem, admin.getFullName()))
                        .defaultIfEmpty(mapToAuditLogResponse(logItem, "Quản trị viên #" + logItem.getAdminId())))
                .collectList();

        return Mono.zip(userMono, profileMono, docsMono, logsMono)
                .map(tuple -> {
                    User user = tuple.getT1();
                    FarmerProfile profile = tuple.getT2();
                    List<FarmerKycDocumentResponse> docs = tuple.getT3();
                    List<VerificationAuditLogResponse> logs = tuple.getT4();

                    String latestRemark = logs.isEmpty() ? null : logs.get(0).getReason();

                    return FarmerKycStatusResponse.builder()
                            .farmerId(farmerId)
                            .kycStatus(user.getKycStatus() != null ? user.getKycStatus() : "UNVERIFIED")
                            .isApproved(profile.getIsApproved() != null && profile.getIsApproved())
                            .latestRemark(latestRemark)
                            .documents(docs)
                            .auditLogs(logs)
                            .build();
                });
    }

    public Flux<PendingFarmerKycResponse> getPendingKycList() {
        return userRepository.findByKycStatusOrderByCreatedAtDesc("PENDING")
                .flatMap(user -> farmerProfileRepository.findByFarmerId(user.getUserId())
                        .defaultIfEmpty(FarmerProfile.builder()
                                .farmerId(user.getUserId())
                                .stallName("Nông Trại")
                                .farmAddress("Chưa cập nhật")
                                .isApproved(false)
                                .build())
                        .flatMap(profile -> farmerKycDocumentRepository.findByFarmerId(user.getUserId()).collectList()
                                .map(docs -> {
                                    LocalDateTime lastSubmit = docs.stream()
                                            .map(FarmerKycDocument::getCreatedAt)
                                            .filter(Objects::nonNull)
                                            .max(LocalDateTime::compareTo)
                                            .orElse(user.getCreatedAt());

                                    return PendingFarmerKycResponse.builder()
                                            .farmerId(user.getUserId())
                                            .fullName(user.getFullName())
                                            .email(user.getEmail())
                                            .phoneNumber(user.getPhoneNumber())
                                            .stallName(profile.getStallName())
                                            .farmAddress(profile.getFarmAddress())
                                            .kycStatus(user.getKycStatus() != null ? user.getKycStatus() : "PENDING")
                                            .documentCount(docs.size())
                                            .lastSubmittedAt(lastSubmit)
                                            .build();
                                })));
    }

    @Transactional
    public Mono<FarmerKycStatusResponse> reviewFarmerKyc(Long adminId, Long farmerId, AdminKycReviewRequest request) {
        if (request == null || request.getAction() == null) {
            return Mono.error(new IllegalArgumentException("Hành động kiểm duyệt không được để trống."));
        }

        String action = request.getAction().trim().toUpperCase();
        String reason = request.getReason() != null ? request.getReason().trim() : "";

        if (("REJECT".equals(action) || "REQUEST_REVISION".equals(action)) && reason.isEmpty()) {
            return Mono.error(new IllegalArgumentException("Vui lòng nhập lý do cụ thể khi từ chối hoặc yêu cầu sửa đổi hồ sơ KYC."));
        }

        String newKycStatus;
        Boolean newIsApproved;

        switch (action) {
            case "APPROVE":
                newKycStatus = "VERIFIED";
                newIsApproved = true;
                break;
            case "REJECT":
                newKycStatus = "REJECTED";
                newIsApproved = false;
                break;
            case "REQUEST_REVISION":
                newKycStatus = "UNVERIFIED";
                newIsApproved = false;
                break;
            default:
                return Mono.error(new IllegalArgumentException("Hành động kiểm duyệt không hợp lệ: " + action + ". Chọn APPROVE, REJECT hoặc REQUEST_REVISION"));
        }

        VerificationAuditLog auditLog = VerificationAuditLog.builder()
                .targetUserId(farmerId)
                .adminId(adminId)
                .action(action)
                .reason(reason)
                .reviewedAt(LocalDateTime.now())
                .build();

        return farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.defer(() -> {
                    FarmerProfile defaultProfile = FarmerProfile.builder()
                            .farmerId(farmerId)
                            .stallName("Nông Trại")
                            .farmAddress("Chưa cập nhật")
                            .isApproved(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return farmerProfileRepository.save(defaultProfile);
                }))
                .flatMap(profile -> userRepository.updateKycStatus(farmerId, newKycStatus, LocalDateTime.now())
                        .then(farmerProfileRepository.updateApprovalStatus(farmerId, newIsApproved, LocalDateTime.now()))
                        .then(verificationAuditLogRepository.save(auditLog))
                        .doOnSuccess(saved -> log.info("Admin [{}] đã thực hiện [{}] KYC cho nông dân [{}]", adminId, action, farmerId))
                        .then(getFarmerKycStatus(farmerId)));
    }

    private FarmerKycDocumentResponse mapToDocResponse(FarmerKycDocument doc) {
        return FarmerKycDocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .farmerId(doc.getFarmerId())
                .documentUrl(doc.getDocumentUrl())
                .documentNumber(doc.getDocumentNumber())
                .issuedDate(doc.getIssuedDate())
                .expiryDate(doc.getExpiryDate())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private VerificationAuditLogResponse mapToAuditLogResponse(VerificationAuditLog log, String adminName) {
        return VerificationAuditLogResponse.builder()
                .logId(log.getLogId())
                .targetUserId(log.getTargetUserId())
                .adminId(log.getAdminId())
                .adminName(adminName)
                .action(log.getAction())
                .reason(log.getReason())
                .reviewedAt(log.getReviewedAt())
                .build();
    }
}
