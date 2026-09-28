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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@Tag(name = "6. Admin Farmer KYC Review", description = "APIs for Admin KYC review, VietGAP certificate validation, and granting selling permissions to Farmers")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/admin/kyc")
@RequiredArgsConstructor
public class AdminKycController {

    private final KycService kycService;
    private final UserRepository userRepository;

    @Operation(summary = "View pending KYC applications", description = "Retrieves all farmers with PENDING KYC status and submitted document count, with keyword search.")
    @GetMapping("/pending")
    public Mono<ResponseEntity<ApiResponse<List<PendingFarmerKycResponse>>>> getPendingKycList(
            @RequestParam(value = "keyword", required = false) String keyword) {
        return kycService.getPendingKycList(keyword)
                .collectList()
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved pending KYC application list successfully.", list)));
    }

    @Operation(summary = "View detailed farmer KYC application", description = "Retrieves account info, farm details, attached documents, and previous moderation history.")
    @GetMapping("/farmers/{farmerId}")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> getFarmerKycDetail(
            @PathVariable("farmerId") Long farmerId) {
        return kycService.getFarmerKycStatus(farmerId)
                .map(res -> ResponseEntity.ok(ApiResponse.success("Retrieved farmer KYC application details successfully.", res)));
    }

    @Operation(summary = "Approve or decline KYC application", description = "Administrator performs: APPROVE (grants selling authority is_approved=true), REJECT, or REQUEST_REVISION. Audit trail saved to verification_audit_logs.")
    @PostMapping("/farmers/{farmerId}/review")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> reviewFarmerKyc(
            Authentication authentication,
            @PathVariable("farmerId") Long farmerId,
            @Valid @RequestBody AdminKycReviewRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Administrator information not found.")))
                .flatMap(admin -> kycService.reviewFarmerKyc(admin.getUserId(), farmerId, request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Processed KYC application decision successfully.", res)));
    }
}
