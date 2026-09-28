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
     * Sends OTP verification email to user inbox (Non-blocking Reactive)
     *
     * @param toEmail   Recipient email
     * @param fullName  Recipient full name
     * @param otpCode   6-digit OTP code
     * @param type      Verification type (PASSWORD_RESET, EMAIL_CONFIRMATION...)
     */
    public Mono<Void> sendOtpEmail(String toEmail, String fullName, String otpCode, String type) {
        return Mono.fromRunnable(() -> {
            try {
                log.info("Starting dispatch of OTP email [{}] type [{}] to: {}", otpCode, type, toEmail);

                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(
                        message,
                        MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                        StandardCharsets.UTF_8.name()
                );

                helper.setFrom(fromEmail, "MarketLink - Farmers Market");
                helper.setTo(toEmail);

                String subject;
                String actionTitle;
                if ("PASSWORD_RESET".equalsIgnoreCase(type)) {
                    subject = "[MarketLink] Your Password Reset Verification Code";
                    actionTitle = "Reset Account Password";
                } else {
                    subject = "[MarketLink] Your Account Verification Code";
                    actionTitle = "Account Verification";
                }

                helper.setSubject(subject);
                helper.setText(buildHtmlEmail(fullName, otpCode, actionTitle), true);

                mailSender.send(message);
                log.info("Successfully sent OTP email to: {}", toEmail);
            } catch (Exception e) {
                log.error("Error sending OTP email to {}: {}", toEmail, e.getMessage(), e);
                throw new RuntimeException("Unable to send OTP email to " + toEmail + ": " + e.getMessage(), e);
            }
        })
        .subscribeOn(Schedulers.boundedElastic())
        .then();
    }

    /**
     * Generates modern, responsive MarketLink branded HTML email template
     */
    private String buildHtmlEmail(String fullName, String otpCode, String actionTitle) {
        String displayName = (fullName != null && !fullName.trim().isEmpty()) ? fullName : "Valued Customer";

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
                + "    <p class=\"tagline\">Farmers Market & Fresh Organic Produce</p>"
                + "  </div>"
                + "  <div class=\"body\">"
                + "    <div class=\"greeting\">Hello " + displayName + ",</div>"
                + "    <p class=\"desc\">"
                + "      You (or someone) recently requested <strong>" + actionTitle + "</strong> on MarketLink platform. "
                + "      Here is your 6-digit secure verification code:"
                + "    </p>"
                + "    <div class=\"otp-box\">"
                + "      <div class=\"otp-title\">OTP Verification Code</div>"
                + "      <div class=\"otp-code\">" + otpCode + "</div>"
                + "    </div>"
                + "    <div class=\"warning-box\">"
                + "      ⏱️ <strong>Note:</strong> This code is valid for <strong>10 minutes</strong>. "
                + "      Never share this code with anyone (including MarketLink support staff) to protect your account."
                + "    </div>"
                + "    <p class=\"desc\" style=\"margin-top: 20px; font-size: 13px;\">"
                + "      If you did not make this request, please disregard this email or update your password immediately."
                + "    </p>"
                + "  </div>"
                + "  <div class=\"footer\">"
                + "    <p style=\"margin: 0 0 6px 0;\">This is an automated email from MarketLink Security System.</p>"
                + "    <p style=\"margin: 0;\">© 2026 MarketLink Platform. All rights reserved.</p>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }
}
