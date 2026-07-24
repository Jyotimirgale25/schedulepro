package com.schedulepro.common.config.security;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j


public class CustomOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;


    @Value("${app.base-url:http://localhost}")
    private String baseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        log.info("Success handler started");

        try {
            CustomOAuth2User principal = (CustomOAuth2User) authentication.getPrincipal();

            log.info("Email: {}", principal.getEmail());

            String token = jwtTokenProvider.generateToken(authentication);

            log.info("JWT generated");

            String redirectUrl =
                    "/oauth2/redirect?token=" + token;

            log.info("Redirecting to {}", redirectUrl);

            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("OAuth success handler failed", e);
            response.sendRedirect("http://localhost/login?error=oauth_failed");
        }
    }
}