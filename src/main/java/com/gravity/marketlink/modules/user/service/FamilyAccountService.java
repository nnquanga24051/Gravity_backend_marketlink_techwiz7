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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng của người mời (ID: " + inviterId + ")")))
                .flatMap(inviterProfile -> userRepository.findById(inviterId)
                        .flatMap(inviterUser -> {
                            if (inviterUser.getEmail().equalsIgnoreCase(inviteeEmail)) {
                                return Mono.error(new IllegalArgumentException("Bạn không thể tự gửi lời mời gia đình cho chính mình."));
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
                        .defaultIfEmpty(mapToInvitationResponse(inv, "Khách hàng #" + inv.getInviterId())));

        Flux<FamilyInvitationResponse> receivedFlux = familyAccountInvitationRepository.findByInviteeEmail(email.toLowerCase())
                .flatMap(inv -> userRepository.findById(inv.getInviterId())
                        .map(u -> mapToInvitationResponse(inv, u.getFullName()))
                        .defaultIfEmpty(mapToInvitationResponse(inv, "Khách hàng #" + inv.getInviterId())));

        return Flux.merge(sentFlux, receivedFlux).distinct(FamilyInvitationResponse::getInvitationId);
    }

    @Transactional
    public Mono<FamilyInvitationResponse> acceptInvitation(Long customerId, String email, FamilyAcceptInviteRequest request) {
        String token = request.getInvitationToken().trim();

        return familyAccountInvitationRepository.findByInvitationToken(token)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy lời mời với mã token đã cung cấp.")))
                .flatMap(invitation -> {
                    if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
                        return Mono.error(new IllegalArgumentException("Lời mời này không còn ở trạng thái chờ duyệt (Hiện tại: " + invitation.getStatus() + ")."));
                    }
                    if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
                        invitation.setStatus("EXPIRED");
                        return familyAccountInvitationRepository.save(invitation)
                                .then(Mono.error(new IllegalArgumentException("Lời mời tham gia gia đình đã hết hạn.")));
                    }
                    if (!invitation.getInviteeEmail().equalsIgnoreCase(email.trim())) {
                        return Mono.error(new IllegalArgumentException("Email tài khoản hiện tại không khớp với email được nhận lời mời (" + invitation.getInviteeEmail() + ")."));
                    }

                    // Look up inviter's profile to get the effective family head ID
                    return customerProfileRepository.findByCustomerId(invitation.getInviterId())
                            .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ người mời.")))
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy lời mời với mã token đã cung cấp.")))
                .flatMap(invitation -> {
                    if (!"PENDING".equalsIgnoreCase(invitation.getStatus())) {
                        return Mono.error(new IllegalArgumentException("Lời mời không thể từ chối vì đang ở trạng thái: " + invitation.getStatus()));
                    }
                    if (!invitation.getInviteeEmail().equalsIgnoreCase(email.trim())) {
                        return Mono.error(new IllegalArgumentException("Bạn không có quyền từ chối lời mời của tài khoản khác."));
                    }

                    invitation.setStatus("REJECTED");
                    return familyAccountInvitationRepository.save(invitation)
                            .then(userRepository.findById(invitation.getInviterId()))
                            .map(inviter -> mapToInvitationResponse(invitation, inviter.getFullName()))
                            .defaultIfEmpty(mapToInvitationResponse(invitation, "Khách hàng #" + invitation.getInviterId()));
                });
    }

    public Flux<FamilyMemberResponse> getFamilyMembers(Long customerId) {
        return customerProfileRepository.findByCustomerId(customerId)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng ID: " + customerId)))
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng ID: " + customerId)))
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy hồ sơ khách hàng chủ nhóm.")))
                .flatMap(callerProfile -> {
                    Long familyId = callerProfile.getFamilyAccountId();
                    // Caller must be the head of the family
                    if (familyId == null || !callerId.equals(familyId)) {
                        return Mono.error(new IllegalArgumentException("Chỉ chủ nhóm tài khoản gia đình mới có quyền xóa thành viên khác."));
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
