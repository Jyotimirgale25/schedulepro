package com.schedulepro.common.config.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpiration;

    // ✅ ADD THIS METHOD - It validates the secret when app starts
    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            log.error("❌❌❌ JWT SECRET NOT CONFIGURED! ❌❌❌");
            log.error("Please set JWT_SECRET environment variable");
            log.error("Example: export JWT_SECRET=yourSuperSecretKey1234567890");
            throw new IllegalStateException("JWT secret is required but not provided");
        }

        if (jwtSecret.length() < 32) {
            log.warn("⚠️ JWT secret is less than 32 characters. This is insecure for production!");
        }

        log.info("✅ JWT Secret loaded successfully (length: {})", jwtSecret.length());
    }
    private SecretKey key() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        String email;
        List<String> roles;

        // ✅ Handle both UserDetails (email/password login) and OAuth2User (Google login)
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetails) {
            // ✅ Regular login
            UserDetails userDetails = (UserDetails) principal;
            email = userDetails.getUsername();
            roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .map(role -> role.replace("ROLE_", ""))
                    .collect(Collectors.toList());
        } else if (principal instanceof CustomOAuth2User) {
            // ✅ OAuth2 login (Google)
            CustomOAuth2User oauth2User = (CustomOAuth2User) principal;
            email = oauth2User.getEmail();
            roles = oauth2User.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .map(role -> role.replace("ROLE_", ""))
                    .collect(Collectors.toList());
        } else {
            // ✅ Fallback - try to get email from authentication name
            email = authentication.getName();
            roles = List.of("EMPLOYEE");
            log.warn("⚠️ Unknown principal type: {}, using fallback", principal.getClass().getName());
        }

        log.info("================== JWT DEBUG ==================");
        log.info("User email: {}", email);
        log.info("Roles found: {}", roles);
        log.info("================================================");

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(email)
                .claim("roles", roles)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key())
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public List<String> getRolesFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return (List<String>) claims.get("roles");
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String generateToken(String email, String role) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
        return generateToken(auth);
    }
}