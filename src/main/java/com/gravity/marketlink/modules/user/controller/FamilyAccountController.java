package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.*;
import com.gravity.marketlink.modules.user.service.FamilyAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "8. Khách hàng - Tài khoản gia đình (Family Account)", description = "Các API liên kết tài khoản gia đình để cùng chia sẻ đơn hàng, danh sách đặt trước (Pre-reservation) và cùng nhận hàng")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/customer/family")
@RequiredArgsConstructor
public class FamilyAccountController {

    private final FamilyAccountService familyAccountService;
    private final UserRepository userRepository;

    @Operation(summary = "Gửi lời mời tham gia nhóm gia đình", description = "Khách hàng mời thành viên khác vào nhóm gia đình thông qua email. Hệ thống sinh mã token mời có hiệu lực trong 7 ngày.")
    @PostMapping("/invite")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> inviteMember(
            Authentication authentication,
            @Valid @RequestBody FamilyInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.inviteMember(user.getUserId(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Lời mời tham gia gia đình đã được gửi thành công.", res)));
    }

    @Operation(summary = "Xem danh sách lời mời gửi đi và nhận được", description = "Lấy các lời mời gia đình do tài khoản hiện tại gửi hoặc các lời mời gửi đến email của tài khoản.")
    @GetMapping("/invitations")
    public Mono<ResponseEntity<ApiResponse<List<FamilyInvitationResponse>>>> getMyInvitations(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.getMyInvitations(user.getUserId(), user.getEmail()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách lời mời gia đình thành công.", list)));
    }

    @Operation(summary = "Chấp nhận lời mời tham gia gia đình", description = "Khách hàng sử dụng token lời mời nhận được để liên kết tài khoản vào nhóm gia đình chung.")
    @PostMapping("/accept")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> acceptInvitation(
            Authentication authentication,
            @Valid @RequestBody FamilyAcceptInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.acceptInvitation(user.getUserId(), user.getEmail(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Đã chấp nhận lời mời và gia nhập nhóm gia đình thành công.", res)));
    }

    @Operation(summary = "Từ chối lời mời tham gia gia đình", description = "Từ chối lời mời gia đình.")
    @PostMapping("/reject")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> rejectInvitation(
            Authentication authentication,
            @Valid @RequestBody FamilyAcceptInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.rejectInvitation(user.getEmail(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Đã từ chối lời mời gia đình.", res)));
    }

    @Operation(summary = "Xem danh sách thành viên trong nhóm gia đình", description = "Lấy tất cả các thành viên cùng nhóm gia đình (bao gồm chủ nhóm và các thành viên liên kết).")
    @GetMapping("/members")
    public Mono<ResponseEntity<ApiResponse<List<FamilyMemberResponse>>>> getFamilyMembers(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.getFamilyMembers(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách thành viên gia đình thành công.", list)));
    }

    @Operation(summary = "Rời khỏi nhóm gia đình", description = "Thành viên tự hủy liên kết tài khoản của mình khỏi nhóm gia đình.")
    @DeleteMapping("/leave")
    public Mono<ResponseEntity<ApiResponse<Void>>> leaveFamily(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.leaveFamily(user.getUserId()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Bạn đã rời khỏi nhóm gia đình thành công.", null)));
    }

    @Operation(summary = "Chủ nhóm xóa thành viên khỏi nhóm gia đình", description = "Chỉ chủ nhóm (Head of Family) mới có quyền xóa thành viên khác khỏi nhóm gia đình.")
    @DeleteMapping("/members/{memberId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeMember(
            Authentication authentication,
            @PathVariable("memberId") Long memberId) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin khách hàng.")))
                .flatMap(user -> familyAccountService.removeMember(user.getUserId(), memberId))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Đã xóa thành viên khỏi nhóm gia đình thành công.", null)));
    }
}
