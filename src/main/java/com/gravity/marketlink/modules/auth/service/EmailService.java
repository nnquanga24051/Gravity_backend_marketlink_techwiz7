package com.gravity.marketlink.modules.auth.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:nnquanga24051@cusc.ctu.edu.vn}")
    private String fromEmail;

    /**
     * Gửi email mã OTP xác minh thực tế tới hộp thư người dùng (Non-blocking Reactive)
     *
     * @param toEmail   Email người nhận
     * @param fullName  Họ và tên người nhận
     * @param otpCode   Mã OTP gồm 6 chữ số
     * @param type      Loại xác minh (PASSWORD_RESET, EMAIL_CONFIRMATION...)
     */
    public Mono<Void> sendOtpEmail(String toEmail, String fullName, String otpCode, String type) {
        return Mono.fromRunnable(() -> {
            try {
                log.info("Bắt đầu gửi email OTP [{}] loại [{}] đến địa chỉ: {}", otpCode, type, toEmail);

                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(
                        message,
                        MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                        StandardCharsets.UTF_8.name()
                );

                helper.setFrom(fromEmail, "MarketLink - Chợ Phiên Nông Sản");
                helper.setTo(toEmail);

                String subject;
                String actionTitle;
                if ("PASSWORD_RESET".equalsIgnoreCase(type)) {
                    subject = "[MarketLink] Mã xác nhận đặt lại mật khẩu của bạn";
                    actionTitle = "Đặt Lại Mật Khẩu Tài Khoản";
                } else {
                    subject = "[MarketLink] Mã xác minh tài khoản của bạn";
                    actionTitle = "Xác Minh Tài Khoản";
                }

                helper.setSubject(subject);
                helper.setText(buildHtmlEmail(fullName, otpCode, actionTitle), true);

                mailSender.send(message);
                log.info("Đã gửi thành công email OTP tới: {}", toEmail);
            } catch (Exception e) {
                log.error("Lỗi khi gửi email OTP tới {}: {}", toEmail, e.getMessage(), e);
                throw new RuntimeException("Không thể gửi email OTP tới " + toEmail + ": " + e.getMessage(), e);
            }
        })
        .subscribeOn(Schedulers.boundedElastic())
        .then();
    }

    /**
     * Tạo giao diện HTML Email thương hiệu MarketLink hiện đại, responsive
     */
    private String buildHtmlEmail(String fullName, String otpCode, String actionTitle) {
        String displayName = (fullName != null && !fullName.trim().isEmpty()) ? fullName : "Quý khách";

        return "<!DOCTYPE html>"
                + "<html lang=\"vi\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<style>"
                + "  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }"
                + "  .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }"
                + "  .header { background: linear-gradient(135deg, #16a34a 0%, #14532d 100%); padding: 32px 24px; text-align: center; color: #ffffff; }"
                + "  .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px 0; }"
                + "  .tagline { font-size: 13px; opacity: 0.9; margin: 0; }"
                + "  .body { padding: 32px 28px; }"
                + "  .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }"
                + "  .desc { font-size: 14.5px; line-height: 1.6; color: #475569; margin-bottom: 24px; }"
                + "  .otp-box { background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }"
                + "  .otp-title { font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }"
                + "  .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #15803d; margin: 0; }"
                + "  .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #92400e; margin-top: 20px; line-height: 1.5; }"
                + "  .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"container\">"
                + "  <div class=\"header\">"
                + "    <h1 class=\"brand\">🌱 MARKETLINK</h1>"
                + "    <p class=\"tagline\">Chợ Phiên Nông Sản & Nông Sản Sạch An Toàn</p>"
                + "  </div>"
                + "  <div class=\"body\">"
                + "    <div class=\"greeting\">Xin chào " + displayName + ",</div>"
                + "    <p class=\"desc\">"
                + "      Bạn (hoặc ai đó) vừa gửi yêu cầu <strong>" + actionTitle + "</strong> trên hệ thống MarketLink. "
                + "      Dưới đây là mã xác minh bảo mật gồm 6 chữ số của bạn:"
                + "    </p>"
                + "    <div class=\"otp-box\">"
                + "      <div class=\"otp-title\">Mã Xác Minh OTP</div>"
                + "      <div class=\"otp-code\">" + otpCode + "</div>"
                + "    </div>"
                + "    <div class=\"warning-box\">"
                + "      ⏱️ <strong>Lưu ý:</strong> Mã này có hiệu lực trong vòng <strong>10 phút</strong>. "
                + "      Tuyệt đối không chia sẻ mã này cho bất kỳ ai (kể cả nhân viên hỗ trợ của MarketLink) để tránh bị chiếm đoạt tài khoản."
                + "    </div>"
                + "    <p class=\"desc\" style=\"margin-top: 20px; font-size: 13px;\">"
                + "      Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc đổi mật khẩu tài khoản ngay lập tức."
                + "    </p>"
                + "  </div>"
                + "  <div class=\"footer\">"
                + "    <p style=\"margin: 0 0 6px 0;\">Email này được gửi tự động từ hệ thống bảo mật MarketLink.</p>"
                + "    <p style=\"margin: 0;\">© 2026 MarketLink Platform. All rights reserved.</p>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
