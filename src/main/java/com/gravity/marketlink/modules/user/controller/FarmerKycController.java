package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.FarmerKycStatusResponse;
import com.gravity.marketlink.modules.user.dto.FarmerKycSubmitRequest;
import com.gravity.marketlink.modules.user.service.KycService;
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

@Tag(name = "5. Nông dân - Định danh KYC (Farmer KYC)", description = "Các API nộp hồ sơ, tải lên giấy phép/chứng nhận VietGAP và theo dõi trạng thái duyệt KYC của Nông dân")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/farmer/kyc")
@RequiredArgsConstructor
public class FarmerKycController {

    private final KycService kycService;
    private final UserRepository userRepository;

    @Operation(summary = "Nộp hồ sơ định danh KYC", description = "Nông dân nộp danh sách tài liệu KYC (CCCD, Giấy phép kinh doanh, Chứng nhận VietGAP/Hữu cơ, Ảnh trang trại). Trạng thái tài khoản sẽ chuyển sang PENDING.")
    @PostMapping("/submit")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> submitKyc(
            Authentication authentication,
            @Valid @RequestBody FarmerKycSubmitRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> kycService.submitKyc(user.getUserId(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Hồ sơ KYC đã được nộp thành công và đang chờ Quản trị viên phê duyệt.", res)));
    }

    @Operation(summary = "Xem hồ sơ & trạng thái KYC cá nhân", description = "Lấy trạng thái phê duyệt bán hàng, danh sách tài liệu đã nộp và các phản hồi/nhật ký kiểm duyệt từ Quản trị viên.")
    @GetMapping("/my-documents")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> getMyKycDocuments(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin tài khoản nông dân.")))
                .flatMap(user -> kycService.getFarmerKycStatus(user.getUserId()))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ KYC thành công.", res)));
    }
}
