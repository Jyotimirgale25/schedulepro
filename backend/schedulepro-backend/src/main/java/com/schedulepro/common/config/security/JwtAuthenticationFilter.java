package com.schedulepro.common.config.security;

import com.schedulepro.common.config.security.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    // ✅ PUBLIC PATHS - SKIP JWT VALIDATION
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/auth/login",
            "/api/auth/send-otp",
            "/api/auth/resend-otp",
            "/api/auth/verify-otp",
            "/api/auth/forgot-password",
            "/api/auth/verify-password-otp",
            "/api/auth/reset-password",
            "/api/auth/register",
            "/login",
            "/oauth2",
            "/oauth2/callback",
            "/oauth2/redirect",
            "/login/oauth2/code/google",
            "/login/oauth2/code/**",
            "/api/auth/register",
            "/api/auth/test-token",
            "/api/auth/oauth-config",    // ✅ ADD THIS
            "/api/auth/diagnose",        // ✅ ADD THIS
            "/api/auth/test-google-api",
            "/login/**",
            "/api/test",
            "/swagger-ui",
            "/api-docs",
            "/actuator"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        System.out.println("🔍 REQUEST PATH: " + path);

        // ✅ SKIP JWT VALIDATION FOR PUBLIC PATHS
        if (isPublicPath(path)) {
            System.out.println("🔓 Public path: " + path + " - Skipping JWT validation");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String jwt = getJwtFromRequest(request);
            System.out.println("🔍 JWT received: " + (jwt != null ? "YES" : "NO"));

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                String email = tokenProvider.getUsernameFromToken(jwt);
                System.out.println("🔍 Email: " + email);

                List<String> roles = tokenProvider.getRolesFromToken(jwt);
                System.out.println("🔍 Roles from token: " + roles);

                List<SimpleGrantedAuthority> authorities = roles.stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList());
                System.out.println("🔍 Authorities: " + authorities);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("✅ Authentication set for: " + email);
            } else {
                System.out.println("❌ No valid JWT token found");
                // ✅ Don't set authentication for protected paths without token
                // The SecurityConfig will handle 401
            }
        } catch (Exception ex) {
            System.err.println("❌ JWT Filter Error: " + ex.getMessage());
            ex.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // ✅ Helper method to check if path is public
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
}