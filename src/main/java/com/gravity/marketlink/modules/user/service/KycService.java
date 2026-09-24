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
        return farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ Nông dân với ID: " + farmerId)))
                .flatMap(profile -> {
                    // For each document item in the request, save or update
                    List<FarmerKycItemRequest> docs = request.getDocuments();

                    Flux<FarmerKycDocument> saveDocsFlux = Flux.fromIterable(docs)
                            .flatMap(item -> farmerKycDocumentRepository.findByFarmerIdAndDocumentType(farmerId, item.getDocumentType())
                                    .flatMap(existing -> {
                                        existing.setDocumentUrl(item.getDocumentUrl());
                                        existing.setDocumentNumber(item.getDocumentNumber());
                                        existing.setIssuedDate(item.getIssuedDate());
                                        existing.setExpiryDate(item.getExpiryDate());
                                        return farmerKycDocumentRepository.save(existing);
                                    })
                                    .switchIfEmpty(farmerKycDocumentRepository.save(
                                            FarmerKycDocument.builder()
                                                    .farmerId(farmerId)
                                                    .documentType(item.getDocumentType())
                                                    .documentUrl(item.getDocumentUrl())
                                                    .documentNumber(item.getDocumentNumber())
                                                    .issuedDate(item.getIssuedDate())
                                                    .expiryDate(item.getExpiryDate())
                                                    .createdAt(LocalDateTime.now())
                                                    .build()
                                    )));

                    return saveDocsFlux.then(userRepository.updateKycStatus(farmerId, "PENDING", LocalDateTime.now()))
                            .then(getFarmerKycStatus(farmerId));
                });
    }

    public Mono<FarmerKycStatusResponse> getFarmerKycStatus(Long farmerId) {
        Mono<User> userMono = userRepository.findById(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + farmerId)));
        Mono<FarmerProfile> profileMono = farmerProfileRepository.findByFarmerId(farmerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ Nông dân với ID: " + farmerId)));
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
                            .kycStatus(user.getKycStatus())
                            .isApproved(profile.getIsApproved())
                            .latestRemark(latestRemark)
                            .documents(docs)
                            .auditLogs(logs)
                            .build();
                });
    }

    public Flux<PendingFarmerKycResponse> getPendingKycList() {
        return userRepository.findByKycStatusOrderByCreatedAtDesc("PENDING")
                .flatMap(user -> farmerProfileRepository.findByFarmerId(user.getUserId())
                        .flatMap(profile -> farmerKycDocumentRepository.findByFarmerId(user.getUserId()).collectList()
                                .map(docs -> {
                                    LocalDateTime lastSubmit = docs.stream()
                                            .map(FarmerKycDocument::getCreatedAt)
                                            .filter(java.util.Objects::nonNull)
                                            .max(LocalDateTime::compareTo)
                                            .orElse(user.getCreatedAt());

                                    return PendingFarmerKycResponse.builder()
                                            .farmerId(user.getUserId())
                                            .fullName(user.getFullName())
                                            .email(user.getEmail())
                                            .phoneNumber(user.getPhoneNumber())
                                            .stallName(profile.getStallName())
                                            .farmAddress(profile.getFarmAddress())
                                            .kycStatus(user.getKycStatus())
                                            .documentCount(docs.size())
                                            .lastSubmittedAt(lastSubmit)
                                            .build();
                                })));
    }

    @Transactional
    public Mono<FarmerKycStatusResponse> reviewFarmerKyc(Long adminId, Long farmerId, AdminKycReviewRequest request) {
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy nông dân với ID: " + farmerId)))
                .then(userRepository.updateKycStatus(farmerId, newKycStatus, LocalDateTime.now()))
                .then(farmerProfileRepository.updateApprovalStatus(farmerId, newIsApproved, LocalDateTime.now()))
                .then(verificationAuditLogRepository.save(auditLog))
                .doOnSuccess(saved -> log.info("Admin [{}] đã thực hiện [{}] KYC cho nông dân [{}]", adminId, action, farmerId))
                .then(getFarmerKycStatus(farmerId));
    }

    private FarmerKycDocumentResponse mapToDocResponse(FarmerKycDocument doc) {
        return FarmerKycDocumentResponse.builder()
                .documentId(doc.getDocumentId())
                .farmerId(doc.getFarmerId())
                .documentType(doc.getDocumentType())
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
