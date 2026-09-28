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

@Tag(name = "6. System Announcements & News", description = "APIs for platform news, market operational notices, and administrative policies")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final UserRepository userRepository;

    @Operation(summary = "View active system announcements", description = "Public endpoint. Accessible by all users, supports keyword search, type, and target role filters.")
    @GetMapping("/announcements")
    public Mono<ResponseEntity<ApiResponse<List<AnnouncementResponse>>>> getActiveAnnouncements(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "targetRole", required = false) String targetRole) {
        return announcementService.getActiveAnnouncements(keyword, type, targetRole)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved system announcements successfully.", list)));
    }

    @Operation(summary = "View detailed announcement article", description = "Public endpoint. View detailed article content.")
    @GetMapping("/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> getAnnouncementById(@PathVariable("id") Long id) {
        return announcementService.getAnnouncementById(id)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Retrieved announcement details successfully.", res)));
    }

    @Operation(summary = "Administrator views all announcements", description = "Includes both active and inactive notices. Supports search, type, role, and status filters. Requires ROLE_ADMIN.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/announcements")
    public Mono<ResponseEntity<ApiResponse<List<AnnouncementResponse>>>> getAllAnnouncementsForAdmin(
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "targetRole", required = false) String targetRole,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
        return announcementService.getAllAnnouncements(keyword, type, targetRole, isActive)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved all announcements successfully.", list)));
    }

    @Operation(summary = "Administrator creates new announcement", description = "Requires ROLE_ADMIN authority.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Administrator account information not found.")))
                .flatMap(user -> announcementService.createAnnouncement(user.getUserId(), request))
                .map(created -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Created system announcement successfully.", created)));
    }

    @Operation(summary = "Administrator updates announcement", description = "Requires ROLE_ADMIN authority.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> updateAnnouncement(
            @PathVariable("id") Long id,
            @Valid @RequestBody AnnouncementRequest request) {
        return announcementService.updateAnnouncement(id, request)
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Updated system announcement successfully.", updated)));
    }

    @Operation(summary = "Administrator toggles announcement visibility", description = "Requires ROLE_ADMIN authority.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/announcements/{id}/toggle-status")
    public Mono<ResponseEntity<ApiResponse<AnnouncementResponse>>> toggleAnnouncementStatus(
            @PathVariable("id") Long id,
            @RequestParam(value = "isActive", required = false) Boolean isActive) {
        return announcementService.toggleAnnouncementStatus(id, isActive)
                .map(updated -> ResponseEntity.ok(ApiResponse.success("Updated announcement visibility status successfully.", updated)));
    }

    @Operation(summary = "Administrator deletes announcement", description = "Requires ROLE_ADMIN authority.")
    @SecurityRequirement(name = "Bearer Authentication")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/admin/announcements/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteAnnouncement(@PathVariable("id") Long id) {
        return announcementService.deleteAnnouncement(id)
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Deleted system announcement successfully.", null)));
    }
}
