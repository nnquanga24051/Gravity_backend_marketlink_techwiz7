package com.gravity.marketlink.modules.notification.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.notification.dto.AnnouncementRequest;
import com.gravity.marketlink.modules.notification.dto.AnnouncementResponse;
import com.gravity.marketlink.modules.notification.service.AnnouncementService;
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

@Tag(name = "6. Tin tức & Thông báo hệ thống (System Announcements)", description = "Các API bảng tin, thông báo vận hành chợ và chính sách của Ban quản trị")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;

    @Operation(summary = "Xem danh sách tin tức hệ thống đang hoạt động", description = "Public endpoint. Dành cho người dùng và khách xem bảng tin, hỗ trợ tìm kiếm theo từ khóa.")
    @GetMapping("/announcements")
    public Mono<ResponseEntity<ApiResponse<List<AnnouncementResponse>>>> getActiveAnnouncements(
            @RequestParam(value = "keyword", required = false) String keyword) {
        return announcementService.getActiveAnnouncements(keyword)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách tin tức hệ thống thành công.", list)));
    }

    @Operation(summary = "Xem chi tiết một bản tin thông báo", description = "Public endpoint. Xem nội dung chi tiết bài viết.")
    @GetMapping("/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> getAnnouncementById(@PathVariable("id") Long id) {
        return announcementService.getAnnouncementById(id)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Lấy chi tiết tin tức thành công.", res)));
    }

    @Operation(summary = "Quản trị viên xem tất cả các tin tức", description = "Bao gồm cả tin tức đang bật và tắt. Hỗ trợ tìm kiếm từ khóa. Yêu cầu ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/announcements")
    public Mono<ResponseEntity<ApiResponse<List<AnnouncementResponse>>>> getAllAnnouncementsForAdmin(
            @RequestParam(value = "keyword", required = false) String keyword) {
        return announcementService.getAllAnnouncements(keyword)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy tất cả tin tức hệ thống thành công.", list)));
    }

    @Operation(summary = "Quản trị viên đăng tin tức mới", description = "Yêu cầu ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/announcements")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> createAnnouncement(
            Authentication authentication,
            @Valid @RequestBody AnnouncementRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin quản trị viên.")))
                .flatMap(user -> announcementService.createAnnouncement(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Đăng tin tức hệ thống thành công.", created)));
    }

    @Operation(summary = "Quản trị viên cập nhật tin tức", description = "Yêu cầu ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> updateAnnouncement(
            @PathVariable("id") Long id,
            @Valid @RequestBody AnnouncementRequest request) {
        return announcementService.updateAnnouncement(id, request)
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Cập nhật tin tức hệ thống thành công.", updated)));
    }

    @Operation(summary = "Quản trị viên xóa tin tức", description = "Yêu cầu ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteAnnouncement(@PathVariable("id") Long id) {
        return announcementService.deleteAnnouncement(id)
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Xóa tin tức hệ thống thành công.", null)));
    }
}
