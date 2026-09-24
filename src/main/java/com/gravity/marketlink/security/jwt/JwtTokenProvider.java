package com.gravity.marketlink.security.jwt;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${security.jwt.secret:quang_dev_backend_techwiz_susc_2026}")
    private String jwtSecret;

    @Value("${security.jwt.expiration-ms:1800000}")
    private long jwtExpirationInMs;

    @Value("${security.jwt.issuer:http://localhost:8081}")
    private String jwtIssuer;

    private static final String HMAC_SHA256 = "HmacSHA256";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private SecretKeySpec secretKeySpec;

    // Danh sách lưu trữ các Token đã bị thu hồi (Blacklist do đăng xuất)
    private final java.util.Set<String> blacklistedTokens = java.util.concurrent.ConcurrentHashMap.newKeySet();

    @PostConstruct
    public void init() {
        this.secretKeySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
    }

    public String generateToken(Long userId, String email, List<String> roles) {
        try {
            long nowMillis = System.currentTimeMillis();
            long expMillis = nowMillis + jwtExpirationInMs;

            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new HashMap<>();
            payload.put("iss", jwtIssuer);
            payload.put("sub", email);
            payload.put("userId", userId);
            payload.put("roles", roles);
            payload.put("iat", nowMillis / 1000);
            payload.put("exp", expMillis / 1000);

            String encodedHeader = base64UrlEncode(
                    objectMapper.writeValueAsString(header).getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(
                    objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8));

            String dataToSign = encodedHeader + "." + encodedPayload;
            String signature = sign(dataToSign);

            return dataToSign + "." + signature;
        } catch (Exception e) {
            log.error("Lỗi khi tạo JWT token: {}", e.getMessage());
            throw new RuntimeException("Không thể tạo JWT Token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            if (isTokenBlacklisted(token)) {
                log.warn("Token JWT này đã bị vô hiệu hóa do người dùng đã đăng xuất.");
                return false;
            }

            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String dataToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(dataToSign);

            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            Map<String, Object> claims = parsePayload(parts[1]);

            // Kiểm tra Issuer (nếu có trong token)
            Object issObj = claims.get("iss");
            if (issObj != null && !jwtIssuer.equals(issObj)) {
                log.warn("JWT issuer không hợp lệ: expected {}, got {}", jwtIssuer, issObj);
                return false;
            }

            // Kiểm tra Expiration
            Object expObj = claims.get("exp");
            if (expObj instanceof Number expNumber) {
                long expSeconds = expNumber.longValue();
                if (System.currentTimeMillis() / 1000 > expSeconds) {
                    return false; // Token hết hạn
                }
            }

            return true;
        } catch (Exception e) {
            log.warn("Token JWT không hợp lệ: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Đưa Token vào Blacklist để vô hiệu hóa ngay lập tức
     */
    public void blacklistToken(String token) {
        if (token != null && !token.trim().isEmpty()) {
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            blacklistedTokens.add(token.trim());
            log.info("Token JWT đã được đưa vào Blacklist thành công.");
        }
    }

    /**
     * Kiểm tra xem Token đã bị đưa vào Blacklist chưa
     */
    public boolean isTokenBlacklisted(String token) {
        if (token == null) return false;
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return blacklistedTokens.contains(token.trim());
    }

    public String getEmailFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        return (String) claims.get("sub");
    }

    public Long getUserIdFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        Object userId = claims.get("userId");
        if (userId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        Object roles = claims.get("roles");
        if (roles instanceof List) {
            return (List<String>) roles;
        }
        return List.of();
    }

    private Map<String, Object> getClaims(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Định dạng token không đúng");
            }
            return parsePayload(parts[1]);
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể giải mã claims từ token", e);
        }
    }

    private Map<String, Object> parsePayload(String encodedPayload) throws Exception {
        byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedPayload);
        return objectMapper.readValue(decodedBytes, new TypeReference<Map<String, Object>>() {
        });
    }

    private String sign(String data) throws Exception {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        mac.init(secretKeySpec);
        byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(hmacBytes);
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
