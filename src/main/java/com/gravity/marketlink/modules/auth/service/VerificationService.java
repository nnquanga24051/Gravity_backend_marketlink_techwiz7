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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với thông tin: " + destination)))
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
                            .doOnSuccess(saved -> log.info("Đã tạo mã OTP [{}] loại [{}] cho người dùng ID [{}]", otpCode, type, user.getUserId()))
                            .flatMap(saved -> emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otpCode, type)
                                    .thenReturn(saved)
                                    .onErrorResume(err -> {
                                        log.error("Lỗi khi gửi email OTP đến {}: {}", user.getEmail(), err.getMessage());
                                        return Mono.error(new RuntimeException("Không thể gửi email OTP đến " + user.getEmail() + ". Chi tiết: " + err.getMessage()));
                                    }))
                            .map(saved -> OtpResponse.builder()
                                    .success(true)
                                    .message("Mã xác minh OTP đã được gửi đến email " + maskEmail(user.getEmail()) + ". Vui lòng kiểm tra hộp thư đến (Inbox) hoặc mục Spam.")
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
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với thông tin: " + destination)))
                .flatMap(user -> userVerificationRepository.findTopByUserIdAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId(), type)
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy yêu cầu xác minh hợp lệ hoặc mã đã được sử dụng.")))
                        .flatMap(verification -> {
                            if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
                                return Mono.error(new IllegalArgumentException("Mã xác minh OTP đã hết hạn. Vui lòng yêu cầu mã mới."));
                            }

                            if (verification.getAttemptsCount() >= 5) {
                                return Mono.error(new IllegalArgumentException("Bạn đã nhập sai mã xác minh quá 5 lần. Vui lòng yêu cầu mã mới."));
                            }

                            if (!verification.getVerificationCode().equals(code)) {
                                verification.setAttemptsCount(verification.getAttemptsCount() + 1);
                                return userVerificationRepository.save(verification)
                                        .then(Mono.error(new IllegalArgumentException("Mã xác minh không chính xác. Số lần còn lại: " + (5 - verification.getAttemptsCount()))));
                            }

                            // Match found
                            verification.setIsUsed(true);
                            return userVerificationRepository.save(verification)
                                    .then(applyVerificationSuccess(user.getUserId(), type))
                                    .thenReturn(OtpResponse.builder()
                                            .success(true)
                                            .message("Xác minh mã OTP thành công cho loại: " + type)
                                            .devCode(null)
                                            .build());
                        }));
    }

    public Mono<OtpResponse> resetPassword(ResetPasswordRequest request) {
        String destination = request.getEmailOrPhone().trim();
        String code = request.getCode().trim();
        String newPassword = request.getNewPassword().trim();

        return findUserByEmailOrPhone(destination)
                .switchIfEmpty(Mono.error(new ResourceNotFoundException("Không tìm thấy người dùng với thông tin: " + destination)))
                .flatMap(user -> userVerificationRepository.findTopByUserIdAndVerificationTypeAndIsUsedFalseOrderByCreatedAtDesc(user.getUserId(), "PASSWORD_RESET")
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ hoặc mã OTP đã hết hiệu lực.")))
                        .flatMap(verification -> {
                            if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
                                return Mono.error(new IllegalArgumentException("Mã OTP đặt lại mật khẩu đã hết hạn."));
                            }
                            if (verification.getAttemptsCount() >= 5) {
                                return Mono.error(new IllegalArgumentException("Đã nhập sai mã quá 5 lần."));
                            }
                            if (!verification.getVerificationCode().equals(code)) {
                                verification.setAttemptsCount(verification.getAttemptsCount() + 1);
                                return userVerificationRepository.save(verification)
                                        .then(Mono.error(new IllegalArgumentException("Mã OTP không chính xác.")));
                            }

                            verification.setIsUsed(true);
                            String encodedPass = passwordEncoder.encode(newPassword);

                            return userVerificationRepository.save(verification)
                                    .then(userRepository.updatePassword(user.getUserId(), encodedPass, LocalDateTime.now()))
                                    .thenReturn(OtpResponse.builder()
                                            .success(true)
                                            .message("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.")
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
