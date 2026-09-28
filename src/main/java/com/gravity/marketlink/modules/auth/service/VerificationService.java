package com.gravity.marketlink.modules.auth.service;

import com.gravity.marketlink.core.exception.ResourceNotFoundException;
import com.gravity.marketlink.modules.auth.dto.OtpResponse;
import com.gravity.marketlink.modules.auth.dto.ResetPasswordRequest;
import com.gravity.marketlink.modules.auth.dto.SendOtpRequest;
import com.gravity.marketlink.modules.auth.dto.VerifyOtpRequest;
import com.gravity.marketlink.modules.auth.entity.User;
import com.gravity.marketlink.modules.auth.repository.UserRepository;
import com.gravity.marketlink.modules.user.entity.UserVerification;
import com.gravity.marketlink.modules.user.repository.UserVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final UserRepository userRepository;
    private final UserVerificationRepository userVerificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public Mono<OtpResponse> sendOtp(SendOtpRequest request) {
        String destination = request.getEmailOrPhone().trim();
        String type = request.getType().trim().toUpperCase();

        return findUserByEmailOrPhone(destination)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User not found with information: " + destination)))
                .flatMap(user -> {
                    // Generate 6-digit OTP
                    int randomNum = 100000 + secureRandom.nextInt(900000);
                    String otpCode = String.valueOf(randomNum);

                    UserVerification verification = UserVerification.builder()
                            .userId(user.getUserId())
                            .verificationType(type)
                            .verificationCode(otpCode)
                            .targetDestination(destination)
                            .isUsed(false)
                            .attemptsCount(0)
                            .expiresAt(LocalDateTime.now().plusMinutes(10))
                            .createdAt(LocalDateTime.now())
                            .build();

                    return userVerificationRepository.save(verification)
                            .doOnSuccess(saved -> log.info("Generated OTP [{}] type [{}] for user ID [{}]", otpCode, type, user.getUserId()))
                            .flatMap(saved -> emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otpCode, type)
                                    .thenReturn(saved)
                                    .onErrorResume(err -> {
                                        log.error("Error sending OTP email to {}: {}", user.getEmail(), err.getMessage());
                                        return Mono.error(new RuntimeException("Unable to send OTP email to " + user.getEmail() + ". Details: " + err.getMessage()));
                                    }))
                            .map(saved -> OtpResponse.builder()
                                    .success(true)
                                    .message("Verification OTP code has been sent to email " + maskEmail(user.getEmail()) + ". Please check your Inbox or Spam folder.")
                                    .devCode(null)
                                    .build());
                });
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        String[] parts = email.split("@");
        String name = parts[0];
        if (name.length() <= 2) return name.charAt(0) + "***@" + parts[1];
        return name.charAt(0) + "***" + name.charAt(name.length() - 1) + "@" + parts[1];
    }

    public Mono<OtpResponse> verifyOtp(VerifyOtpRequest request) {
        String destination = request.getEmailOrPhone().trim();
        String type = request.getType().trim().toUpperCase();
        String code = request.getCode().trim();

        return findUserByEmailOrPhone(destination)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User not found with information: " + destination)))
                .flatMap(user -> userVerificationRepository.findTopByUserIdAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId(), type)
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("No valid verification request found or code already used.")))
                        .flatMap(verification -> {
                            if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
                                return Mono.error(new IllegalArgumentException("OTP verification code has expired. Please request a new one."));
                            }

                            if (verification.getAttemptsCount() >= 5) {
                                return Mono.error(new IllegalArgumentException("You entered the wrong code more than 5 times. Please request a new code."));
                            }

                            if (!verification.getVerificationCode().equals(code)) {
                                verification.setAttemptsCount(verification.getAttemptsCount() + 1);
                                return userVerificationRepository.save(verification)
                                        .then(Mono.error(new IllegalArgumentException("Incorrect verification code. Attempts remaining: " + (5 - verification.getAttemptsCount()))));
                            }

                            // Match found
                            verification.setIsUsed(true);
                            return userVerificationRepository.save(verification)
                                    .then(applyVerificationSuccess(user.getUserId(), type))
                                    .thenReturn(OtpResponse.builder()
                                            .success(true)
                                            .message("OTP code verified successfully for type: " + type)
                                            .devCode(null)
                                            .build());
                        }));
    }

    public Mono<OtpResponse> resetPassword(ResetPasswordRequest request) {
        String destination = request.getEmailOrPhone().trim();
        String code = request.getCode().trim();
        String newPassword = request.getNewPassword().trim();

        return findUserByEmailOrPhone(destination)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("User not found with information: " + destination)))
                .flatMap(user -> userVerificationRepository.findTopByUserIdAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId(), "PASSWORD_RESET")
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("No valid password reset request found or code has expired.")))
                        .flatMap(verification -> {
                            if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
                                return Mono.error(new IllegalArgumentException("Password reset OTP code has expired."));
                            }
                            if (verification.getAttemptsCount() >= 5) {
                                return Mono.error(new IllegalArgumentException("Incorrect code entered more than 5 times."));
                            }
                            if (!verification.getVerificationCode().equals(code)) {
                                verification.setAttemptsCount(verification.getAttemptsCount() + 1);
                                return userVerificationRepository.save(verification)
                                        .then(Mono.error(new IllegalArgumentException("Incorrect OTP code.")));
                            }

                            verification.setIsUsed(true);
                            String encodedPass = passwordEncoder.encode(newPassword);

                            return userVerificationRepository.save(verification)
                                    .then(userRepository.updatePassword(user.getUserId(), encodedPass, LocalDateTime.now()))
                                    .thenReturn(OtpResponse.builder()
                                            .success(true)
                                            .message("Password reset successfully. You can now log in with your new password.")
                                            .devCode(null)
                                            .build());
                        }));
    }

    private Mono<Void> applyVerificationSuccess(Long userId, String type) {
        if ("EMAIL_CONFIRMATION".equalsIgnoreCase(type)) {
            return userRepository.updateEmailVerified(userId, true, LocalDateTime.now()).then();
        } else if ("PHONE_OTP".equalsIgnoreCase(type)) {
            return userRepository.updatePhoneVerified(userId, true, LocalDateTime.now()).then();
        }
        return Mono.empty();
    }

    private Mono<User> findUserByEmailOrPhone(String destination) {
        if (destination.contains("@")) {
            return userRepository.findByEmail(destination);
        }
        return userRepository.findByPhoneNumber(destination);
    }
}
