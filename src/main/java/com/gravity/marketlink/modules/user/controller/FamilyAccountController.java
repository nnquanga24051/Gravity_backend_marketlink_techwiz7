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

@Tag(name = "8. Customer Family Accounts", description = "APIs for linking family accounts to share orders, pre-reservations, and pickup slots")
@SecurityRequirement(name = "Bearer Authentication")
@RestController
@RequestMapping("/api/customer/family")
@RequiredArgsConstructor
public class FamilyAccountController {

    private final FamilyAccountService familyAccountService;
    private final UserRepository userRepository;

    @Operation(summary = "Send family group invitation", description = "Customer invites member via email. System generates invitation token valid for 7 days.")
    @PostMapping("/invite")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> inviteMember(
            Authentication authentication,
            @Valid @RequestBody FamilyInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.inviteMember(user.getUserId(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Family invitation sent successfully.", res)));
    }

    @Operation(summary = "View sent and received family invitations", description = "Retrieves family invitations sent by or received for current user account.")
    @GetMapping("/invitations")
    public Mono<ResponseEntity<ApiResponse<List<FamilyInvitationResponse>>>> getMyInvitations(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.getMyInvitations(user.getUserId(), user.getEmail()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved family invitations successfully.", list)));
    }

    @Operation(summary = "Accept family group invitation", description = "Customer uses received token to link account with family group.")
    @PostMapping("/accept")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> acceptInvitation(
            Authentication authentication,
            @Valid @RequestBody FamilyAcceptInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.acceptInvitation(user.getUserId(), user.getEmail(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Accepted invitation and joined family group successfully.", res)));
    }

    @Operation(summary = "Decline family group invitation", description = "Decline family invitation.")
    @PostMapping("/reject")
    public Mono<ResponseEntity<ApiResponse<FamilyInvitationResponse>>> rejectInvitation(
            Authentication authentication,
            @Valid @RequestBody FamilyAcceptInviteRequest request) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.rejectInvitation(user.getEmail(), request))
                .map(res -> ResponseEntity.ok(ApiResponse.success("Declined family invitation.", res)));
    }

    @Operation(summary = "View family group members", description = "Retrieves all members of family group (including group head and linked members).")
    @GetMapping("/members")
    public Mono<ResponseEntity<ApiResponse<List<FamilyMemberResponse>>>> getFamilyMembers(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.getFamilyMembers(user.getUserId()).collectList())
                .map(list -> ResponseEntity.ok(ApiResponse.success("Retrieved family members successfully.", list)));
    }

    @Operation(summary = "Leave family group", description = "Member voluntarily unlinks account from family group.")
    @DeleteMapping("/leave")
    public Mono<ResponseEntity<ApiResponse<Void>>> leaveFamily(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.leaveFamily(user.getUserId()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("You have left the family group successfully.", null)));
    }

    @Operation(summary = "Family head removes member from family group", description = "Only the head of family has permission to remove members from family group.")
    @DeleteMapping("/members/{memberId}")
    public Mono<ResponseEntity<ApiResponse<Void>>> removeMember(
            Authentication authentication,
            @PathVariable("memberId") Long memberId) {
        if (authentication == null || authentication.getName() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        return userRepository.findByEmail(authentication.getName())
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer information not found.")))
                .flatMap(user -> familyAccountService.removeMember(user.getUserId(), memberId))
                .thenReturn(ResponseEntity.ok(ApiResponse.success("Removed member from family group successfully.", null)));
    }
}
