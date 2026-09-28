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
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Tag(name = "5. Farmer KYC Verification", description = "APIs for submitting documents, uploading VietGAP certifications, and tracking farmer KYC status")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/farmer/kyc")
@RequiredArgsConstructor
public class FarmerKycController {

    private final KycService kycService;
    private final UserRepository userRepository;

    @Operation(summary = "Submit KYC verification documents", description = "Farmer submits KYC documents (National ID, Business license, VietGAP/Organic certificates, Farm photos). Account status transitions to PENDING.")
    @PostMapping("/submit")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> submitKyc(
            Authentication authentication,
            @Valid @RequestBody FarmerKycSubmitRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> kycService.submitKyc(user.getUserId(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("KYC documents submitted successfully, awaiting Administrator review.", res)));
    }

    @Operation(summary = "View personal KYC profile & status", description = "Retrieves selling permission status, submitted document list, and Administrator audit notes.")
    @GetMapping("/my-documents")
    public Mono<ResponseEntity<ApiResponse<FarmerKycStatusResponse>>> getMyKycDocuments(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Farmer account information not found.")))
                .flatMap(user -> kycService.getFarmerKycStatus(user.getUserId()))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Retrieved KYC application details successfully.", res)));
    }
}
