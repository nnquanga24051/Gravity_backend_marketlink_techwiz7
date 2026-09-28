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
 * Manages JSON Web Token (JWT) lifecycle following Dual-Token security standards (Access + Refresh Token)
 * Compliant with RFC 7519: JTI UUID identifier, Issuer validation, HMAC-SHA256 Timing-Safe, and Auto-Evicting Blacklist.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${security.jwt.secret:quang_dev_backend_techwiz_susc_2026_super_secure_key}")
    private String jwtSecret;

    @Getter
    @Value("${security.jwt.expiration-ms:1800000}")
    private long jwtExpirationInMs; // Default 30 minutes

    @Getter
    @Value("${security.jwt.refresh-expiration-ms:604800000}")
    private long jwtRefreshExpirationInMs; // Default 7 days

    @Value("${security.jwt.issuer:http://localhost:8081}")
    private String jwtIssuer;

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final long CLOCK_SKEW_SECONDS = 60; // Allow 60-second clock skew tolerance

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SecretKeySpec secretKeySpec;

    // Blacklisted tokens with TTL expiration for automatic RAM eviction
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        this.secretKeySpec = new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
        log.info("JwtTokenProvider initialized: HMAC-SHA256 with Issuer={}, AccessTokenTTL={}ms, RefreshTokenTTL={}ms",
                jwtIssuer, jwtExpirationInMs, jwtRefreshExpirationInMs);
    }

    /**
     * 1. Generates Access Token (Short-lived - Default 30 minutes)
     */
    public String generateAccessToken(Long userId, String email, List<String> roles) {
        long nowMillis = System.currentTimeMillis();
        long expMillis = nowMillis + jwtExpirationInMs;

        Map<String, Object> payload = new HashMap<>();
        payload.put("jti", UUID.randomUUID().toString()); // Unique token identifier (JTI)
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
     * 2. Generates Refresh Token (Long-lived - Default 7 days)
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
     * Backward compatibility: Default generates Access Token
     */
    public String generateToken(Long userId, String email, List<String> roles) {
        return generateAccessToken(userId, email, roles);
    }

    /**
     * 3. Validates Access Token passed in Authorization header
     */
    public boolean validateToken(String token) {
        return validateJwt(token, "ACCESS");
    }

    /**
     * 4. Validates Refresh Token used for token renewal
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
                log.warn("JWT token has been revoked (Blacklist).");
                return false;
            }

            String[] parts = cleanToken.split("\\.");
            if (parts.length != 3) {
                log.warn("Invalid JWT structure: must consist of 3 parts (header.payload.signature).");
                return false;
            }

            // 1. Verify HMAC-SHA256 signature (Timing-Safe)
            String dataToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(dataToSign);

            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8),
                    expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                log.warn("JWT signature mismatch or token has been tampered with.");
                return false;
            }

            // 2. Verify Payload Claims
            Map<String, Object> claims = parsePayload(parts[1]);

            // Issuer
            Object issObj = claims.get("iss");
            if (issObj != null && !jwtIssuer.equals(issObj)) {
                log.warn("JWT issuer mismatch: expected {}, got {}", jwtIssuer, issObj);
                return false;
            }

            // Token Type (if required)
            if (expectedType != null) {
                Object typeObj = claims.get("tokenType");
                if (typeObj != null && !expectedType.equalsIgnoreCase(typeObj.toString())) {
                    log.warn("Invalid token type: expected {}, got {}", expectedType, typeObj);
                    return false;
                }
            }

            // Expiration Time (with Clock Skew tolerance)
            Object expObj = claims.get("exp");
            if (expObj instanceof Number expNumber) {
                long expSeconds = expNumber.longValue();
                long nowSeconds = System.currentTimeMillis() / 1000;
                if (nowSeconds - CLOCK_SKEW_SECONDS > expSeconds) {
                    log.warn("JWT token expired at: {} (current: {})", expSeconds, nowSeconds);
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.warn("Error validating JWT token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 5. Revokes token and adds to memory Blacklist with TTL
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
            log.info("Token JTI={} added to Blacklist until {}", claims.get("jti"), new Date(expMillis));

            // Automatically clean up expired tokens from Blacklist to prevent memory leak
            cleanExpiredBlacklist();
        } catch (Exception e) {
            // If token is malformed, block temporarily
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
                throw new IllegalArgumentException("Invalid token format: must consist of 3 parts");
            }
            return parsePayload(parts[1]);
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot decode claims from token", e);
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
            log.error("Error generating JWT token: {}", e.getMessage());
            throw new RuntimeException("Unable to generate JWT token", e);
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
