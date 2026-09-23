package com.gravity.marketlink.modules.user.repository;

import com.gravity.marketlink.modules.user.entity.FamilyAccountInvitation;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface FamilyAccountInvitationRepository extends R2dbcRepository<FamilyAccountInvitation, Long> {
    Mono<FamilyAccountInvitation> findByInvitationToken(String token);
    Flux<FamilyAccountInvitation> findByInviterId(Long inviterId);
    Flux<FamilyAccountInvitation> findByInviteeEmail(String email);
}
