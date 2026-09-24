package com.gravity.marketlink.modules.product.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingRequest;
import com.gravity.marketlink.modules.product.dto.FarmerCutoffSettingResponse;
import com.gravity.marketlink.modules.product.service.CutoffSettingService;
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

@Tag(name = "4. Khung giờ chốt đơn (Farmer Cutoff Settings)", description = "Các API thiết lập hạn chốt đơn trước khi mở chợ cho Nông dân")
@RestController
@RequestMapping("/api/farmer/cutoff-settings")
@RequiredArgsConstructor
public class CutoffController {

    private final CutoffSettingService cutoffSettingService;
    private final UserRepository userRepository;

    @Operation(summary = "Xem danh sách cấu hình chốt đơn của nông dân", description = "Lấy toàn bộ cấu hình chốt đơn theo từng chợ và thứ trong tuần.")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping
    public Mono<ResponseEntity<ApiResponse<List<FarmerCutoffSettingResponse>>>> getSettings(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> cutoffSettingService.getSettings(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy cấu hình chốt đơn thành công.", list)));
    }

    @Operation(summary = "Thêm mới hoặc cập nhật thời hạn chốt đơn", description = "Cấu hình số giờ chốt đơn trước khi phiên chợ mở (VD: 12 tiếng).")
    @SecurityRequirement(name = "Bearer Authentication")
    @PostMapping
    public Mono<ResponseEntity<ApiResponse<FarmerCutoffSettingResponse>>> saveSetting(
            Authentication authentication,
            @Valid @RequestBody FarmerCutoffSettingRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> cutoffSettingService.saveSetting(user.getUserId(), request))
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(ApiResponse.success("Lưu cấu hình hạn chốt đơn thành công.", res)));
    }

    @Operation(summary = "Xóa cấu hình chốt đơn", description = "Xóa cấu hình chốt đơn theo ID.")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<ApiResponse<Void>>> deleteSetting(
            Authentication authentication,
            @PathVariable("id") Long id) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> cutoffSettingService.deleteSetting(user.getUserId(), id))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Xóa cấu hình chốt đơn thành công.", null)));
    }
}
