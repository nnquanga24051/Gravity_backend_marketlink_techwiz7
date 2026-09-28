package com.gravity.marketlink.modules.user.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.dto.*;
import com.gravity.marketlink.modules.user.entity.CustomerProfile;
import com.gravity.marketlink.modules.user.entity.FamilyAccountInvitation;
import com.gravity.marketlink.modules.user.repository.CustomerProfileRepository;
import com.gravity.marketlink.modules.user.repository.FamilyAccountInvitationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyAccountService {

    private final CustomerProfileRepository customerProfileRepository;
    private final FamilyAccountInvitationRepository familyAccountInvitationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Mono<FamilyInvitationResponse> inviteMember(Long inviterId, FamilyInviteRequest request) {
        String inviteeEmail = request.getInviteeEmail().trim().toLowerCase();

        return customerProfileRepository.findByCustomerId(inviterId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer profile not found for inviter (ID: " + inviterId + ")")))
                .flatMap(inviterProfile -> userRepository.findById(inviterId)
                        .flatMap(inviterUser -> {
                            if (inviterUser.getEmail().equalsIgnoreCase(inviteeEmail)) {
                                return Mono.error(new IllegalArgumentException("You cannot send a family invitation to yourself."));
                            }

                            String token = UUID.randomUUID().toString();
                            FamilyAccountInvitation invitation = FamilyAccountInvitation.builder()
                                    .inviterId(inviterId)
                                    .inviteeEmail(inviteeEmail)
                                    .invitationToken(token)
                                    .status("PENDING")
                                    .expiresAt(LocalDateTime.now().plusDays(7))
                                    .createdAt(LocalDateTime.now())
                                    .build();

                            // Also ensure inviter has family_account_id set to their own ID if null
                            Mono<Integer> ensureFamilyIdMono = Mono.just(0);
                            if (inviterProfile.getFamilyAccountId() == null) {
                                ensureFamilyIdMono = customerProfileRepository.updateFamilyAccountId(inviterId, inviterId, LocalDateTime.now());
                            }

                            return ensureFamilyIdMono.then(familyAccountInvitationRepository.save(invitation))
                                    .map(saved -> FamilyInvitationResponse.builder()
                                            .invitationId(saved.getInvitationId())
                                            .inviterId(inviterId)
                                            .inviterName(inviterUser.getFullName())
                                            .inviteeEmail(saved.getInviteeEmail())
                                            .invitationToken(saved.getInvitationToken())
                                            .status(saved.getStatus())
                                            .expiresAt(saved.getExpiresAt())
                                            .createdAt(saved.getCreatedAt())
                                            .build());
                        }));
    }

    public Flux<FamilyInvitationResponse> getMyInvitations(Long customerId, String email) {
        Flux<FamilyInvitationResponse> sentFlux = familyAccountInvitationRepository.findByInviterId(customerId)
                .flatMap(inv -> userRepository.findById(inv.getInviterId())
                        .map(u -> mapToInvitationResponse(inv, u.getFullName()))
                        .defaultIfEmpty(mapToInvitationResponse(inv, "Customer #" + inv.getInviterId())));

        Flux<FamilyInvitationResponse> receivedFlux = familyAccountInvitationRepository.findByInviteeEmail(email.toLowerCase())
                .flatMap(inv -> userRepository.findById(inv.getInviterId())
                        .map(u -> mapToInvitationResponse(inv, u.getFullName()))
                        .defaultIfEmpty(mapToInvitationResponse(inv, "Customer #" + inv.getInviterId())));

        return Flux.merge(sentFlux, receivedFlux).distinct(FamilyInvitationResponse::getInvitationId);
    }

    @Transactional
    public Mono<FamilyInvitationResponse> acceptInvitation(Long customerId, String email, FamilyAcceptInviteRequest request) {
        String token = request.getInvitationToken().trim();

        return familyAccountInvitationRepository.findByInvitationToken(token)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Invitation not found with provided token.")))
                .flatMap(invitation -> {
                    if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
                        return Mono.error(new IllegalArgumentException("This invitation is no longer pending (Current: " + invitation.getStatus() + ")."));
                    }
                    if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                        invitation.setStatus("EXPIRED");
                        return familyAccountInvitationRepository.save(invitation)
                                .then(Mono.error(new IllegalArgumentException("Family group invitation has expired.")));
                    }
                    if (!invitation.getInviteeEmail().equalsIgnoreCase(email.trim())) {
                        return Mono.error(new IllegalArgumentException("Current account email does not match invited email (" + invitation.getInviteeEmail() + ")."));
                    }

                    // Look up inviter's profile to get the effective family head ID
                    return customerProfileRepository.findByCustomerId(invitation.getInviterId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Inviter customer profile not found.")))
                            .flatMap(inviterProfile -> {
                                Long effectiveFamilyId = inviterProfile.getFamilyAccountId() != null ? inviterProfile.getFamilyAccountId() : invitation.getInviterId();

                                invitation.setStatus("ACCEPTED");
                                invitation.setInviteeId(customerId);

                                return familyAccountInvitationRepository.save(invitation)
                                        .then(customerProfileRepository.updateFamilyAccountId(customerId, effectiveFamilyId, LocalDateTime.now()))
                                        .then(userRepository.findById(invitation.getInviterId()))
                                        .map(inviter -> mapToInvitationResponse(invitation, inviter.getFullName()));
                            });
                });
    }

    @Transactional
    public Mono<FamilyInvitationResponse> rejectInvitation(String email, FamilyAcceptInviteRequest request) {
        String token = request.getInvitationToken().trim();

        return familyAccountInvitationRepository.findByInvitationToken(token)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Invitation not found with provided token.")))
                .flatMap(invitation -> {
                    if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
                        return Mono.error(new IllegalArgumentException("Invitation cannot be declined because current status is: " + invitation.getStatus()));
                    }
                    if (!invitation.getInviteeEmail().equalsIgnoreCase(email.trim())) {
                        return Mono.error(new IllegalArgumentException("You do not have permission to decline another account's invitation."));
                    }

                    invitation.setStatus("REJECTED");
                    return familyAccountInvitationRepository.save(invitation)
                            .then(userRepository.findById(invitation.getInviterId()))
                            .map(inviter -> mapToInvitationResponse(invitation, inviter.getFullName()))
                            .defaultIfEmpty(mapToInvitationResponse(invitation, "Customer #" + invitation.getInviterId()));
                });
    }

    public Flux<FamilyMemberResponse> getFamilyMembers(Long customerId) {
        return customerProfileRepository.findByCustomerId(customerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer profile not found with ID: " + customerId)))
                .flatMapMany(currentProfile -> {
                    Long familyId = currentProfile.getFamilyAccountId();
                    if (familyId == null) {
                        // Single user with no family group linked
                        return userRepository.findById(customerId)
                                .map(u -> mapToMemberResponse(u, currentProfile, true))
                                .flux();
                    }

                    // Find all profiles where customer_id = familyId (the head) OR family_account_id = familyId
                    return customerProfileRepository.findByFamilyAccountId(familyId)
                            .concatWith(customerProfileRepository.findByCustomerId(familyId))
                            .distinct(CustomerProfile::getCustomerId)
                            .flatMap(profile -> userRepository.findById(profile.getCustomerId())
                                    .map(user -> mapToMemberResponse(user, profile, profile.getCustomerId().equals(familyId))));
                });
    }

    @Transactional
    public Mono<Void> leaveFamily(Long customerId) {
        return customerProfileRepository.findByCustomerId(customerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Customer profile not found with ID: " + customerId)))
                .flatMap(profile -> {
                    if (profile.getFamilyAccountId() == null) {
                        return Mono.empty();
                    }
                    return customerProfileRepository.clearFamilyAccountId(customerId, LocalDateTime.now()).then();
                });
    }

    @Transactional
    public Mono<Void> removeMember(Long callerId, Long targetMemberId) {
        if (callerId.equals(targetMemberId)) {
            return leaveFamily(callerId);
        }

        return customerProfileRepository.findByCustomerId(callerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Head customer profile not found.")))
                .flatMap(callerProfile -> {
                    Long familyId = callerProfile.getFamilyAccountId();
                    // Caller must be the head of the family
                    if (familyId == null || !callerId.equals(familyId)) {
                        return Mono.error(new IllegalArgumentException("Only the head of family group has permission to remove other members."));
                    }

                    return customerProfileRepository.findByCustomerId(targetMemberId)
                            .flatMap(targetProfile -> {
                                if (familyId.equals(targetProfile.getFamilyAccountId())) {
                                    return customerProfileRepository.clearFamilyAccountId(targetMemberId, LocalDateTime.now()).then();
                                }
                                return Mono.empty();
                            });
                });
    }

    private FamilyInvitationResponse mapToInvitationResponse(FamilyAccountInvitation inv, String inviterName) {
        return FamilyInvitationResponse.builder()
                .invitationId(inv.getInvitationId())
                .inviterId(inv.getInviterId())
                .inviterName(inviterName)
                .inviteeEmail(inv.getInviteeEmail())
                .invitationToken(inv.getInvitationToken())
                .status(inv.getStatus())
                .expiresAt(inv.getExpiresAt())
                .createdAt(inv.getCreatedAt())
                .build();
    }

    private FamilyMemberResponse mapToMemberResponse(User user, CustomerProfile profile, boolean isHead) {
        return FamilyMemberResponse.builder()
                .customerId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .avatarUrl(user.getAvatarUrl())
                .isHeadOfFamily(isHead)
                .defaultAddress(profile.getDefaultAddress())
                .joinedAt(profile.getCreatedAt())
                .build();
    }
}
