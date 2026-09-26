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

    public Flux<AnnouncementResponse> getActiveAnnouncements(String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return announcementRepository.findByIsActiveTrueOrderByPublishedAtDesc()
                .flatMap(this::enrichAnnouncement)
                .filter(a -> kw.isEmpty()
                        || (a.getTitle() != null && a.getTitle().toLowerCase().contains(kw))
                        || (a.getContent() != null && a.getContent().toLowerCase().contains(kw)));
    }

    public Flux<AnnouncementResponse> getActiveAnnouncements() {
        return getActiveAnnouncements(null);
    }

    public Flux<AnnouncementResponse> getAllAnnouncements(String keyword) {
        String kw = (keyword != null) ? keyword.trim().toLowerCase() : "";
        return announcementRepository.findAllByOrderByPublishedAtDesc()
                .flatMap(this::enrichAnnouncement)
                .filter(a -> kw.isEmpty()
                        || (a.getTitle() != null && a.getTitle().toLowerCase().contains(kw))
                        || (a.getContent() != null && a.getContent().toLowerCase().contains(kw)));
    }

    public Flux<AnnouncementResponse> getAllAnnouncements() {
        return getAllAnnouncements(null);
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
                    if (request.getIsActive() != null) {
                        announcement.setIsActive(request.getIsActive());
                    }
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

    private Mono<AnnouncementResponse> enrichAnnouncement(SystemAnnouncement a) {
        return userRepository.findById(a.getAdminId())
                .defaultIfEmpty(User.builder().fullName("Quản trị viên").build())
                .map(admin -> AnnouncementResponse.builder()
                        .announcementId(a.getAnnouncementId())
                        .adminId(a.getAdminId())
                        .adminName(admin.getFullName())
                        .title(a.getTitle())
                        .content(a.getContent())
                        .isActive(a.getIsActive())
                        .publishedAt(a.getPublishedAt())
                        .build());
    }
}
