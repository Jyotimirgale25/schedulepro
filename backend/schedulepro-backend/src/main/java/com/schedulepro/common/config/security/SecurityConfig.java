package com.schedulepro.common.config.security;

import com.schedulepro.common.config.security.CustomUserDetailsService;
import com.schedulepro.common.config.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
@Slf4j
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomOAuth2SuccessHandler customOAuth2SuccessHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost",
                "http://localhost:3000",
                "http://frontend",
                "https://schedulepro-2.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(customUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers(
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/api-docs",

                "/api-docs/**",
                "/webjars/**",
                "/swagger-resources/**"
        );
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // ===== DISABLE CSRF =====
                .csrf(csrf -> csrf.disable())

                // ===== CORS CONFIGURATION =====
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ===== STATELESS SESSION =====
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // ===== AUTHORIZATION RULES =====
                .authorizeHttpRequests(auth -> auth
                        // ✅ Public endpoints - No authentication required
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/auth/login",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/webjars/**",
                                "/api-docs",
                                "/swagger-resources/**",
                                "/actuator/health",
                                "/api/auth/send-otp",
                                "/api/auth/resend-otp",
                                "/api/auth/verify-otp",
                                "/api/auth/forgot-password",
                                "/api/auth/verify-password-otp",
                                "/api/auth/reset-password",
                                "/api/auth/register",
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        // ✅ OAuth2 endpoints
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()

                        // ✅ Swagger & Actuator
                        .requestMatchers("/swagger-ui/**", "/api-docs/**", "/actuator/**").permitAll()

                        // ✅ Test endpoints
                        .requestMatchers("/api/test/**").permitAll()

                        // ✅ Admin endpoints - Only ADMIN role
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // ✅ Manager endpoints - MANAGER or ADMIN
                        .requestMatchers("/api/manager/**").hasAnyRole("MANAGER", "ADMIN")

                        // ✅ Employee endpoints - EMPLOYEE, MANAGER, or ADMIN
                        .requestMatchers("/api/employee/**").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                        .requestMatchers("/api/announcements/**").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")


                        // ✅ All other requests require authentication
                        .anyRequest().authenticated()
                )

                // ===== OAUTH2 LOGIN (GOOGLE) =====
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestRepository(new HttpSessionOAuth2AuthorizationRequestRepository())
                        )
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(customOAuth2SuccessHandler)
                        .failureHandler((request, response, exception) -> {
                            log.error("OAuth2 Login Failed", exception);
                            response.sendRedirect("http://localhost/login?error=oauth_failed");
                        })
                )
                // ===== AUTHENTICATION PROVIDER =====
                .authenticationProvider(authenticationProvider())

                // ===== JWT FILTER =====
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        log.info("🔐 Security Configuration loaded - Public auth endpoints permitted");
        return http.build();
    }
}