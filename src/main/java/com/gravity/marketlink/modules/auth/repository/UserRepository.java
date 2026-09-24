package com.gravity.marketlink.modules.auth.repository;

import com.gravity.marketlink.modules.auth.entity.User;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface UserRepository extends R2dbcRepository<User, Long> {
    Mono<User> findByEmail(String email);
    Mono<Boolean> existsByEmail(String email);
    Mono<Boolean> existsByPhoneNumber(String phoneNumber);

    @Modifying
    @Query("UPDATE users SET full_name = :fullName, phone_number = :phoneNumber, updated_at = :updatedAt WHERE user_id = :userId")
    Mono<Integer> updateBasicInfo(Long userId, String fullName, String phoneNumber, LocalDateTime updatedAt);

    @Modifying
    @Query("UPDATE users SET avatar_url = :avatarUrl, updated_at = :updatedAt WHERE user_id = :userId")
    Mono<Integer> updateAvatar(Long userId, String avatarUrl, LocalDateTime updatedAt);

    @Modifying
    @Query("UPDATE users SET password_hash = :newPasswordHash, updated_at = :updatedAt WHERE user_id = :userId")
    Mono<Integer> updatePassword(Long userId, String newPasswordHash, LocalDateTime updatedAt);
}
