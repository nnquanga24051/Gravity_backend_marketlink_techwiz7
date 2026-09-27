package com.gravity.marketlink.modules.notification.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.notification.dto.AnnouncementRequest;
import com.gravity.marketlink.modules.notification.dto.AnnouncementResponse;
import com.gravity.marketlink.modules.notification.entity.SystemAnnouncement;
import com.gravity.marketlink.modules.notification.repository.SystemAnnouncementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final SystemAnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public Flux<AnnouncementResponse> getActiveAnnouncements(String keyword, String type, String targetRole) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        String fType = (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type.trim())) ? type.trim().toUpperCase() : null;
        String fRole = (targetRole != null && !targetRole.isBlank() && !"all".equalsIgnoreCase(targetRole.trim())) ? targetRole.trim().toUpperCase() : null;

        return announcementRepository.findByIsActiveTrueOrderByPublishedAtDesc()
                .flatMap(this::enrichAnnouncement)
                .filter(a -> {
                    if (!kw.isEmpty()) {
                        boolean matchTitle = a.getTitle() != null && a.getTitle().toLowerCase().contains(kw);
                        boolean matchContent = a.getContent() != null && a.getContent().toLowerCase().contains(kw);
                        if (!matchTitle && !matchContent) return false;
                    }
                    if (fType != null && (a.getType() == null || !a.getType().equalsIgnoreCase(fType))) {
                        return false;
                    }
                    if (fRole != null) {
                        boolean matchRole = a.getTargetRole() == null 
                                || "ALL".equalsIgnoreCase(a.getTargetRole()) 
                                || a.getTargetRole().equalsIgnoreCase(fRole);
                        if (!matchRole) return false;
                    }
                    return true;
                })
                .sort((a, b) -> {
                    int pA = getPriorityWeight(a.getPriority());
                    int pB = getPriorityWeight(b.getPriority());
                    if (pA != pB) return Integer.compare(pB, pA); // Higher priority weight first
                    if (a.getPublishedAt() != null && b.getPublishedAt() != null) {
                        return b.getPublishedAt().compareTo(a.getPublishedAt());
                    }
                    return 0;
                });
    }

    public Flux<AnnouncementResponse> getActiveAnnouncements(String keyword) {
        return getActiveAnnouncements(keyword, null, null);
    }

    public Flux<AnnouncementResponse> getActiveAnnouncements() {
        return getActiveAnnouncements(null, null, null);
    }

    public Flux<AnnouncementResponse> getAllAnnouncements(String keyword, String type, String targetRole, Boolean isActive) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        String fType = (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type.trim())) ? type.trim().toUpperCase() : null;
        String fRole = (targetRole != null && !targetRole.isBlank() && !"all".equalsIgnoreCase(targetRole.trim())) ? targetRole.trim().toUpperCase() : null;

        return announcementRepository.findAllByOrderByPublishedAtDesc()
                .flatMap(this::enrichAnnouncement)
                .filter(a -> {
                    if (!kw.isEmpty()) {
                        boolean matchTitle = a.getTitle() != null && a.getTitle().toLowerCase().contains(kw);
                        boolean matchContent = a.getContent() != null && a.getContent().toLowerCase().contains(kw);
                        if (!matchTitle && !matchContent) return false;
                    }
                    if (fType != null && (a.getType() == null || !a.getType().equalsIgnoreCase(fType))) {
                        return false;
                    }
                    if (fRole != null && (a.getTargetRole() == null || !a.getTargetRole().equalsIgnoreCase(fRole))) {
                        return false;
                    }
                    if (isActive != null && !isActive.equals(a.getIsActive())) {
                        return false;
                    }
                    return true;
                })
                .sort((a, b) -> {
                    int pA = getPriorityWeight(a.getPriority());
                    int pB = getPriorityWeight(b.getPriority());
                    if (pA != pB) return Integer.compare(pB, pA);
                    if (a.getPublishedAt() != null && b.getPublishedAt() != null) {
                        return b.getPublishedAt().compareTo(a.getPublishedAt());
                    }
                    return 0;
                });
    }

    public Flux<AnnouncementResponse> getAllAnnouncements(String keyword) {
        return getAllAnnouncements(keyword, null, null, null);
    }

    public Flux<AnnouncementResponse> getAllAnnouncements() {
        return getAllAnnouncements(null, null, null, null);
    }

    public Mono<AnnouncementResponse> getAnnouncementById(Long id) {
        return announcementRepository.findById(id)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông báo hệ thống với ID: " + id)))
                .flatMap(this::enrichAnnouncement);
    }

    @Transactional
    public Mono<AnnouncementResponse> createAnnouncement(Long adminId, AnnouncementRequest request) {
        SystemAnnouncement announcement = SystemAnnouncement.builder()
                .adminId(adminId)
                .title(request.getTitle())
                .content(request.getContent())
                .type(request.getType() != null && !request.getType().isBlank() ? request.getType().trim().toUpperCase() : "GENERAL")
                .targetRole(request.getTargetRole() != null && !request.getTargetRole().isBlank() ? request.getTargetRole().trim().toUpperCase() : "ALL")
                .priority(request.getPriority() != null && !request.getPriority().isBlank() ? request.getPriority().trim().toUpperCase() : "NORMAL")
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .publishedAt(LocalDateTime.now())
                .build();

        return announcementRepository.save(announcement)
                .flatMap(this::enrichAnnouncement);
    }

    @Transactional
    public Mono<AnnouncementResponse> updateAnnouncement(Long announcementId, AnnouncementRequest request) {
        return announcementRepository.findById(announcementId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông báo hệ thống với ID: " + announcementId)))
                .flatMap(announcement -> {
                    announcement.setTitle(request.getTitle());
                    announcement.setContent(request.getContent());
                    if (request.getType() != null && !request.getType().isBlank()) {
                        announcement.setType(request.getType().trim().toUpperCase());
                    }
                    if (request.getTargetRole() != null && !request.getTargetRole().isBlank()) {
                        announcement.setTargetRole(request.getTargetRole().trim().toUpperCase());
                    }
                    if (request.getPriority() != null && !request.getPriority().isBlank()) {
                        announcement.setPriority(request.getPriority().trim().toUpperCase());
                    }
                    if (request.getIsActive() != null) {
                        announcement.setIsActive(request.getIsActive());
                    }
                    return announcementRepository.save(announcement);
                })
                .flatMap(this::enrichAnnouncement);
    }

    @Transactional
    public Mono<AnnouncementResponse> toggleAnnouncementStatus(Long announcementId, Boolean explicitStatus) {
        return announcementRepository.findById(announcementId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông báo hệ thống với ID: " + announcementId)))
                .flatMap(announcement -> {
                    boolean nextStatus = (explicitStatus != null) ? explicitStatus : !Boolean.TRUE.equals(announcement.getIsActive());
                    announcement.setIsActive(nextStatus);
                    return announcementRepository.save(announcement);
                })
                .flatMap(this::enrichAnnouncement);
    }

    @Transactional
    public Mono<Void> deleteAnnouncement(Long announcementId) {
        return announcementRepository.findById(announcementId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông báo hệ thống với ID: " + announcementId)))
                .flatMap(announcementRepository::delete);
    }

    private int getPriorityWeight(String priority) {
        if (priority == null) return 1;
        return switch (priority.toUpperCase()) {
            case "PINNED" -> 3;
            case "URGENT" -> 2;
            default -> 1;
        };
    }

    private Mono<AnnouncementResponse> enrichAnnouncement(SystemAnnouncement a) {
        return userRepository.findById(a.getAdminId())
                .defaultIfEmpty(User.builder().fullName("Quản trị viên MarketLink").build())
                .map(admin -> AnnouncementResponse.builder()
                        .announcementId(a.getAnnouncementId())
                        .adminId(a.getAdminId())
                        .adminName(admin.getFullName() != null ? admin.getFullName() : "Ban Quản Trị")
                        .title(a.getTitle())
                        .content(a.getContent())
                        .type(a.getType() != null ? a.getType() : "GENERAL")
                        .targetRole(a.getTargetRole() != null ? a.getTargetRole() : "ALL")
                        .priority(a.getPriority() != null ? a.getPriority() : "NORMAL")
                        .isActive(a.getIsActive())
                        .publishedAt(a.getPublishedAt())
                        .createdAt(a.getPublishedAt())
                        .build());
    }
}
