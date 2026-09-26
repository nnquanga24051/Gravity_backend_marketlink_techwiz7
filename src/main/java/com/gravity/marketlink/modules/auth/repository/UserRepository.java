package com.gravity.marketlink.modules.auth.repository;

import com.gravity.marketlink.modules.auth.entity.User;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface UserRepository extends R2dbcRepository<User, Long> {
       Mono<User> findByEmail(String email);

       Mono<User> findByPhoneNumber(String phoneNumber);

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

       @Modifying
       @Query("UPDATE users SET kyc_status = :kycStatus, updated_at = :updatedAt WHERE user_id = :userId")
       Mono<Integer> updateKycStatus(Long userId, String kycStatus, LocalDateTime updatedAt);

       @Modifying
       @Query("UPDATE users SET status = :status, updated_at = :updatedAt WHERE user_id = :userId")
       Mono<Integer> updateStatus(Long userId, String status, LocalDateTime updatedAt);

       @Modifying
       @Query("UPDATE users SET is_email_verified = :verified, updated_at = :updatedAt WHERE user_id = :userId")
       Mono<Integer> updateEmailVerified(Long userId, Boolean verified, LocalDateTime updatedAt);

       @Modifying
       @Query("UPDATE users SET is_phone_verified = :verified, updated_at = :updatedAt WHERE user_id = :userId")
       Mono<Integer> updatePhoneVerified(Long userId, Boolean verified, LocalDateTime updatedAt);

       @Query("SELECT * FROM users WHERE kyc_status = :kycStatus ORDER BY created_at DESC")
       Flux<User> findByKycStatusOrderByCreatedAtDesc(String kycStatus);

       @Query("SELECT u.* FROM users u INNER JOIN user_roles ur ON u.user_id = ur.user_id INNER JOIN roles r ON ur.role_id = r.role_id WHERE r.role_name = :roleName ORDER BY u.created_at DESC")
       Flux<User> findByRoleName(String roleName);
}
