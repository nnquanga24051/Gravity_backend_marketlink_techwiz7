package com.gravity.marketlink.security.jwt;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý vòng đời JSON Web Token (JWT) theo chuẩn bảo mật Dual-Token (Access + Refresh Token)
 * Tuân thủ RFC 7519: JTI UUID định danh, Issuer kiểm chứng, HMAC-SHA256 Timing-Safe, và Auto-Evicting Blacklist.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${security.jwt.secret:quang_dev_backend_techwiz_susc_2026_super_secure_key}")
    private String jwtSecret;

    @Getter
    @Value("${security.jwt.expiration-ms:1800000}")
    private long jwtExpirationInMs; // Mặc định 30 phút

    @Getter
    @Value("${security.jwt.refresh-expiration-ms:604800000}")
    private long jwtRefreshExpirationInMs; // Mặc định 7 ngày

    @Value("${security.jwt.issuer:http://localhost:8081}")
    private String jwtIssuer;

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final long CLOCK_SKEW_SECONDS = 60; // Cho phép dung sai chênh lệch đồng hồ 60 giây

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SecretKeySpec secretKeySpec;

    // Danh sách Token bị thu hồi (Blacklist) kèm hạn hết hạn TTL để tự động dọn dẹp RAM
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        this.secretKeySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
        log.info("JwtTokenProvider đã khởi tạo: HMAC-SHA256 với Issuer={}, AccessTokenTTL={}ms, RefreshTokenTTL={}ms",
                jwtIssuer, jwtExpirationInMs, jwtRefreshExpirationInMs);
    }

    /**
     * 1. Sinh Access Token (Ngắn hạn - Mặc định 30 phút)
     */
    public String generateAccessToken(Long userId, String email, List<String> roles) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + jwtExpirationInMs;

        Map<String, Object> payload = new HashMap<>();
        payload.put("jti", UUID.randomUUID().toString()); // Mã định danh token duy nhất
        payload.put("iss", jwtIssuer);
        payload.put("sub", email);
        payload.put("userId", userId);
        payload.put("roles", roles);
        payload.put("tokenType", "ACCESS");
        payload.put("iat", nowMillis / 1000);
        payload.put("exp", expMillis / 1000);

        return buildSignedJwt(payload);
    }

    /**
     * 2. Sinh Refresh Token (Dài hạn - Mặc định 7 ngày)
     */
    public String generateRefreshToken(Long userId, String email) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + jwtRefreshExpirationInMs;

        Map<String, Object> payload = new HashMap<>();
        payload.put("jti", UUID.randomUUID().toString());
        payload.put("iss", jwtIssuer);
        payload.put("sub", email);
        payload.put("userId", userId);
        payload.put("tokenType", "REFRESH");
        payload.put("iat", nowMillis / 1000);
        payload.put("exp", expMillis / 1000);

        return buildSignedJwt(payload);
    }

    /**
     * Tương thích ngược: Mặc định tạo Access Token
     */
    public String generateToken(Long userId, String email, List<String> roles) {
        return generateAccessToken(userId, email, roles);
    }

    /**
     * 3. Xác thực Access Token gửi kèm Header Authorization
     */
    public boolean validateToken(String token) {
        return validateJwt(token, "ACCESS");
    }

    /**
     * 4. Xác thực Refresh Token dùng để cấp mới Access Token
     */
    public boolean validateRefreshToken(String token) {
        return validateJwt(token, "REFRESH");
    }

    private boolean validateJwt(String token, String expectedType) {
        try {
            if (token == null || token.isBlank()) {
                return false;
            }

            String cleanToken = cleanBearer(token);
            if (isTokenBlacklisted(cleanToken)) {
                log.warn("Token JWT đã bị đưa vào danh sách vô hiệu hóa (Blacklist).");
                return false;
            }

            String[] parts = cleanToken.split("\\.");
            if (parts.length != 3) {
                log.warn("Cấu trúc JWT không đúng 3 phần (header.payload.signature).");
                return false;
            }

            // 1. Kiểm tra chữ ký HMAC-SHA256 (Timing-Safe)
            String dataToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(dataToSign);

            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                log.warn("Chữ ký JWT không khớp hoặc token đã bị giả mạo.");
                return false;
            }

            // 2. Kiểm tra Payload Claims
            Map<String, Object> claims = parsePayload(parts[1]);

            // Issuer
            Object issObj = claims.get("iss");
            if (issObj != null && !jwtIssuer.equals(issObj)) {
                log.warn("JWT issuer không khớp: expected {}, got {}", jwtIssuer, issObj);
                return false;
            }

            // Token Type (nếu có yêu cầu)
            if (expectedType != null) {
                Object typeObj = claims.get("tokenType");
                if (typeObj != null && !expectedType.equalsIgnoreCase(typeObj.toString())) {
                    log.warn("Loại token không đúng: expected {}, got {}", expectedType, typeObj);
                    return false;
                }
            }

            // Expiration Time (kèm Clock Skew)
            Object expObj = claims.get("exp");
            if (expObj instanceof Number expNumber) {
                long expSeconds = expNumber.longValue();
                long nowSeconds = System.currentTimeMillis() / 1000;
                if (nowSeconds - CLOCK_SKEW_SECONDS > expSeconds) {
                    log.warn("Token JWT đã hết hạn lúc: {} (hiện tại: {})", expSeconds, nowSeconds);
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.warn("Lỗi khi xác thực token JWT: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 5. Thu hồi Token và đưa vào Blacklist có thời gian sống (TTL)
     */
    public void blacklistToken(String token) {
        if (token == null || token.isBlank()) return;
        String cleanToken = cleanBearer(token);

        try {
            Map<String, Object> claims = getClaims(cleanToken);
            long expMillis = System.currentTimeMillis() + jwtExpirationInMs; // Fallback

            Object expObj = claims.get("exp");
            if (expObj instanceof Number expNumber) {
                expMillis = expNumber.longValue() * 1000;
            }

            blacklistedTokens.put(cleanToken, expMillis);
            log.info("Token JTI={} đã được thêm vào Blacklist cho đến {}", claims.get("jti"), new Date(expMillis));

            // Tự động dọn dẹp các token đã quá hạn trong Blacklist để bảo toàn dung lượng RAM
            cleanExpiredBlacklist();
        } catch (Exception e) {
            // Nếu token hỏng, vẫn lưu chặn tạm thời
            blacklistedTokens.put(cleanToken, System.currentTimeMillis() + jwtExpirationInMs);
        }
    }

    public boolean isTokenBlacklisted(String token) {
        if (token == null) return false;
        String cleanToken = cleanBearer(token);
        Long expMillis = blacklistedTokens.get(cleanToken);
        if (expMillis == null) {
            return false;
        }
        if (System.currentTimeMillis() > expMillis) {
            blacklistedTokens.remove(cleanToken);
            return false;
        }
        return true;
    }

    private void cleanExpiredBlacklist() {
        long now = System.currentTimeMillis();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < now);
    }

    public String getEmailFromToken(String token) {
        return (String) getClaims(token).get("sub");
    }

    public Long getUserIdFromToken(String token) {
        Object userId = getClaims(token).get("userId");
        if (userId instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public String getJtiFromToken(String token) {
        return (String) getClaims(token).get("jti");
    }

    public String getTokenTypeFromToken(String token) {
        return (String) getClaims(token).get("tokenType");
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Object roles = getClaims(token).get("roles");
        if (roles instanceof List) {
            return (List<String>) roles;
        }
        return List.of();
    }

    public Map<String, Object> getClaims(String token) {
        try {
            String cleanToken = cleanBearer(token);
            String[] parts = cleanToken.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Định dạng token không đúng 3 phần");
            }
            return parsePayload(parts[1]);
        } catch (Exception e) {
            throw new IllegalArgumentException("Không thể giải mã claims từ token", e);
        }
    }

    private String buildSignedJwt(Map<String, Object> payload) {
        try {
            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

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

    private Map<String, Object> parsePayload(String encodedPayload) throws Exception {
        byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedPayload);
        return objectMapper.readValue(decodedBytes, new TypeReference<Map<String, Object>>() {});
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

    private String cleanBearer(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            return token.substring(7).trim();
        }
        return token != null ? token.trim() : "";
    }
}
