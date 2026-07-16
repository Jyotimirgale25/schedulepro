package com.schedulepro.auth.controller;

import com.schedulepro.auth.dto.request.LoginRequest;
import com.schedulepro.auth.dto.request.SendOtpRequest;
import com.schedulepro.auth.dto.request.VerifyOtpRequest;
import com.schedulepro.auth.dto.response.LoginResponse;
import com.schedulepro.auth.dto.request.ForgotPasswordRequest;
import com.schedulepro.auth.dto.response.OtpResponse;
import com.schedulepro.auth.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import java.util.Collections;
import com.schedulepro.auth.service.AuthService;
import com.schedulepro.auth.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.schedulepro.common.config.security.JwtTokenProvider;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.GrantedAuthority;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    // ============================================
    // SEND OTP (Registration)
    // ============================================
    @PostMapping("/send-otp")
    public ResponseEntity<OtpResponse> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        OtpResponse response = authService.sendOtp(request);
        return ResponseEntity.ok(response);
    }

    // ============================================
    // VERIFY OTP (Registration) - FIXED!
    // ============================================
    @PostMapping("/verify-otp")
    public ResponseEntity<OtpResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        log.info("🔐 Verifying OTP for registration: {}", request.getEmail());
        OtpResponse response = authService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    // ============================================
    // RESEND OTP
    // ============================================
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam(required = false) String email) {
        log.info("📧 Resend OTP request for email: {}", email);

        try {
            if (email == null || email.trim().isEmpty()) {
                log.warn("❌ Email is null or empty");
                return ResponseEntity.badRequest().body(
                        OtpResponse.builder()
                                .success(false)
                                .message("Email is required")
                                .build()
                );
            }

            OtpResponse response = authService.resendOtp(email.trim());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Error in resendOtp: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(OtpResponse.builder()
                            .success(false)
                            .message("Failed to resend OTP: " + e.getMessage())
                            .build()
                    );
        }
    }

    // ============================================
    // LOGIN
    // ============================================
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("🔐 Login request for: {}", request.getIdentifier());
        LoginResponse response = authService.authenticateUser(request);
        return ResponseEntity.ok(response);
    }

    // ============================================
    // GET CURRENT USER
    // ============================================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        log.info("👤 Getting current user: {}", userDetails.getUsername());

        User user = authService.getUserByEmail(userDetails.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("username", user.getUsername());
        response.put("fullName", user.getFullName());
        response.put("role", user.getRole());
        response.put("phone", user.getPhone());
        response.put("employeeId", user.getEmployeeId());
        response.put("department", user.getDepartment());
        response.put("position", user.getPosition());

        return ResponseEntity.ok(response);
    }

    // ============================================
    // FORGOT PASSWORD - Send OTP
    // ============================================
    // ============================================
// FORGOT PASSWORD - Send OTP (FIXED)
// ============================================
// ============================================
// FORGOT PASSWORD - Send OTP (FIXED)
// ============================================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        log.info("📧 Forgot password request received");

        // ✅ Log the entire request
        System.out.println("🔍 Request body: " + request);

        String email = request.get("email");
        log.info("📧 Email: {}", email);

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email is required"
            ));
        }

        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email not found"
            ));
        }

        String otp = authService.generateAndSendOTP(email);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "OTP sent to your email",
                "otp", otp
        ));
    }
    // ============================================
    // FORGOT PASSWORD - Verify OTP
    // ============================================
    @PostMapping("/verify-password-otp")
    public ResponseEntity<?> verifyPasswordOTP(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        log.info("🔐 Verifying password reset OTP for: {}", email);

        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email and OTP are required"));
        }

        boolean isValid = authService.verifyOTP(email, otp);

        if (isValid) {
            return ResponseEntity.ok(Map.of("success", true, "message", "OTP verified successfully"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid or expired OTP"));
        }
    }

    // ============================================
    // FORGOT PASSWORD - Reset Password
    // ============================================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        log.info("🔑 Reset password request for: {}", email);

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "All fields are required"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password must be at least 6 characters"));
        }

        boolean isValid = authService.verifyOTP(email, otp);

        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid or expired OTP"));
        }

        authService.resetPassword(email, newPassword);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Password reset successfully"
        ));
    }

    // ============================================
    // TEST JWT TOKEN GENERATION
    // ============================================
    @GetMapping("/test-token")
    public ResponseEntity<?> testToken() {
        try {
            List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"));
            Authentication auth = new UsernamePasswordAuthenticationToken("test@example.com", null, authorities);
            String token = tokenProvider.generateToken(auth);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("token", token);
            response.put("message", "Token generated successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("❌ Test token error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }
    // ============================================
// ✅ GOOGLE LOGIN (Client-side OAuth)
// ============================================
    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String idToken = request.get("token");
        log.info("🔐 Google login request received");

        if (idToken == null || idToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "ID token is required"
            ));
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    new GsonFactory()
            )
                    .setAudience(Collections.singletonList(
                            "157330384875-cjedpfpffmnb0nisf5l6d8809sg31hlm.apps.googleusercontent.com"
                    ))
                    .build();

            GoogleIdToken idTokenObj = verifier.verify(idToken);

            if (idTokenObj != null) {
                GoogleIdToken.Payload payload = idTokenObj.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String picture = (String) payload.get("picture");

                log.info("✅ Google user verified: {}", email);

                User user = userRepository.findByEmail(email)
                        .orElseGet(() -> {
                            log.info("📝 Creating new user from Google login: {}", email);
                            User newUser = User.builder()
                                    .email(email)
                                    .username(email)
                                    .fullName(name)
                                    .role("EMPLOYEE")

                                    .build();
                            return userRepository.save(newUser);
                        });

                String token = tokenProvider.generateToken(email, user.getRole());

                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("token", token);
                response.put("user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "username", user.getUsername(),
                        "fullName", user.getFullName(),
                        "role", user.getRole(),
                        "phone", user.getPhone(),
                        "employeeId", user.getEmployeeId(),
                        "department", user.getDepartment(),
                        "position", user.getPosition()
                ));

                return ResponseEntity.ok(response);

            } else {
                log.warn("❌ Invalid Google ID token");
                return ResponseEntity.status(401).body(Map.of(
                        "success", false,
                        "error", "Invalid ID token"
                ));
            }

        } catch (Exception e) {
            log.error("❌ Google authentication error: {}", e.getMessage(), e);
            return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "error", "Authentication failed: " + e.getMessage()
            ));
        }
    }
}