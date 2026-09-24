package com.gravity.marketlink.modules.user.controller;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.core.response.ApiResponse;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.AdminKycReviewRequest;
import com.gravity.marketlink.modules.user.dto.FarmerKycStatusResponse;
import com.gravity.marketlink.modules.user.dto.PendingFarmerKycResponse;
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
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "6. Quản trị viên - Phê duyệt KYC (Admin KYC)", description = "Các API dành cho Quản trị viên duyệt hồ sơ KYC, kiểm tra tính hợp lệ chứng chỉ VietGAP và kích hoạt quyền bán hàng cho Nông dân")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/kyc")
@RequiredArgsConstructor
public class AdminKycController {

    private final KycService kycService;
    private final UserRepository userRepository;

    @Operation(summary = "Xem danh sách hồ sơ KYC chờ duyệt", description = "Lấy tất cả các nông dân đang có trạng thái KYC là PENDING cùng số lượng tài liệu đã nộp.")
    @GetMapping("/pending")
    public Mono<ResponseEntity<ApiResponse<List<PendingFarmerKycResponse>>>> getPendingKycList() {
        return kycService.getPendingKycList()
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Lấy danh sách hồ sơ KYC chờ duyệt thành công.", list)));
    }

    @Operation(summary = "Xem chi tiết hồ sơ KYC của một nông dân", description = "Lấy thông tin tài khoản, nông trại, chi tiết toàn bộ giấy tờ đính kèm và lịch sử duyệt trước đó.")
    @GetMapping("/farmers/{farmerId}")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> getFarmerKycDetail(
            @PathVariable("farmerId") Long farmerId) {
        return kycService.getFarmerKycStatus(farmerId)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Lấy chi tiết hồ sơ KYC nông dân thành công.", res)));
    }

    @Operation(summary = "Phê duyệt hoặc từ chối hồ sơ KYC", description = "Quản trị viên thực hiện hành động: APPROVE (kích hoạt quyền bán hàng is_approved=true), REJECT (từ chối), hoặc REQUEST_REVISION (yêu cầu nộp lại giấy tờ). Lưu lịch sử vào verification_audit_logs.")
    @PostMapping("/farmers/{farmerId}/review")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> reviewFarmerKyc(
            Authentication authentication,
            @PathVariable("farmerId") Long farmerId,
            @Valid @RequestBody AdminKycReviewRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy thông tin quản trị viên.")))
                .flatMap(admin -> kycService.reviewFarmerKyc(admin.getUserId(), farmerId, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Đã xử lý phê duyệt hồ sơ KYC thành công.", res)));
    }
}
