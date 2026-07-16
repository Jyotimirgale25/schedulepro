package com.schedulepro.auth.service;

import com.schedulepro.auth.dto.request.LoginRequest;
import com.schedulepro.auth.dto.request.SendOtpRequest;
import com.schedulepro.auth.dto.request.VerifyOtpRequest;
import com.schedulepro.auth.dto.response.LoginResponse;
import com.schedulepro.auth.dto.response.OtpResponse;
import com.schedulepro.common.config.security.JwtTokenProvider;
import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    // ============================================
    // SEND OTP (REGISTRATION)
    // ============================================
    public OtpResponse sendOtp(SendOtpRequest request) {
        log.info("📧 Sending OTP to: {}", request.getEmail());

        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is already registered!")
                    .build();
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Username is already taken!")
                    .build();
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Store OTP with user data and expiry (5 minutes)
        OtpData otpData = new OtpData();
        otpData.otp = otp;
        otpData.userData = request;
        otpData.expiryTime = LocalDateTime.now().plusMinutes(5);

        otpStorage.put(request.getEmail(), otpData);

        // Print OTP to console (always works)
        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║     🎫 YOUR OTP CODE FOR SCHEDULE PRO                    ║");
        System.out.println("║                                                          ║");
        System.out.println("║     Email: " + request.getEmail());
        System.out.println("║     OTP:   " + otp);
        System.out.println("║                                                          ║");
        System.out.println("║     This OTP is valid for 5 minutes                      ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");

        // Try to send email
        try {
            emailService.sendOtpEmail(request.getEmail(), otp);
            System.out.println("✅ Email sent to: " + request.getEmail());
        } catch (Exception e) {
            System.out.println("⚠️ Email not sent (check email configuration)");
            log.error("Email sending failed: {}", e.getMessage());
        }

        return OtpResponse.builder()
                .success(true)
                .message("OTP sent successfully. Check console for OTP code.")
                .otp(otp)
                .build();
    }

    // ============================================
    // VERIFY OTP & REGISTER USER
    // ============================================

    // ============================================
// VERIFY OTP & REGISTER USER (WITH DEBUG)
// ============================================
    @Transactional
    public OtpResponse verifyOtp(VerifyOtpRequest request) {
        log.info("🔐 Verifying OTP for: {}", request.getEmail());

        // DEBUG
        System.out.println("========================================");
        System.out.println("🔍 VERIFY OTP STARTED");
        System.out.println("🔍 Email: " + request.getEmail());
        System.out.println("🔍 OTP: " + request.getOtp());
        System.out.println("========================================");

        OtpData otpData = otpStorage.get(request.getEmail());

        // DEBUG
        System.out.println("🔍 OTP Data in storage: " + (otpData != null ? "YES" : "NO"));

        if (otpData == null) {
            return OtpResponse.builder()
                    .success(false)
                    .message("No OTP request found. Please request OTP again.")
                    .build();
        }

        // DEBUG
        System.out.println("🔍 Stored OTP: " + otpData.otp);
        System.out.println("🔍 Expiry: " + otpData.expiryTime);
        System.out.println("🔍 Current: " + LocalDateTime.now());

        if (otpData.expiryTime.isBefore(LocalDateTime.now())) {
            otpStorage.remove(request.getEmail());
            return OtpResponse.builder()
                    .success(false)
                    .message("OTP has expired. Please request again.")
                    .build();
        }

        if (!otpData.otp.equals(request.getOtp())) {
            System.out.println("❌ OTP MISMATCH!");
            return OtpResponse.builder()
                    .success(false)
                    .message("Invalid OTP. Please try again.")
                    .build();
        }

        System.out.println("✅ OTP VERIFIED SUCCESSFULLY!");

        // ✅ OTP verified - Create user
        SendOtpRequest userData = otpData.userData;

        System.out.println("🔍 User Data:");
        System.out.println("   Email: " + userData.getEmail());
        System.out.println("   Username: " + userData.getUsername());
        System.out.println("   FullName: " + userData.getFullName());
        System.out.println("   Role: " + userData.getRole());

        User user = User.builder()
                .username(userData.getUsername())
                .email(userData.getEmail())
                .password(passwordEncoder.encode(userData.getPassword()))
                .fullName(userData.getFullName())
                .role(userData.getRole())
                .isActive(true)
                .isVerified(true)
                .joinDate(LocalDate.now())
                .employeeId(generateEmployeeId(userData.getRole()))
                .createdAt(LocalDateTime.now())
                .build();

        System.out.println("💾 SAVING USER TO DATABASE...");

        try {
            User savedUser = userRepository.save(user);
            System.out.println("✅ USER SAVED SUCCESSFULLY!");
            System.out.println("✅ ID: " + savedUser.getId());
            System.out.println("✅ Email: " + savedUser.getEmail());
            System.out.println("✅ Username: " + savedUser.getUsername());
            System.out.println("✅ FullName: " + savedUser.getFullName());
            System.out.println("✅ Role: " + savedUser.getRole());

            otpStorage.remove(request.getEmail());

            return OtpResponse.builder()
                    .success(true)
                    .message("User registered successfully!")
                    .user(LoginResponse.UserInfo.builder()
                            .id(savedUser.getId())
                            .email(savedUser.getEmail())
                            .username(savedUser.getUsername())
                            .fullName(savedUser.getFullName())
                            .role(savedUser.getRole())
                            .phone(savedUser.getPhone())
                            .build())
                    .build();

        } catch (Exception e) {
            System.err.println("❌ ERROR SAVING USER: " + e.getMessage());
            e.printStackTrace();
            return OtpResponse.builder()
                    .success(false)
                    .message("Error creating user: " + e.getMessage())
                    .build();
        }
    }

    // ============================================
    // RESEND OTP
    // ============================================
    public OtpResponse resendOtp(String email) {
        log.info("📧 Resending OTP to: {}", email);

        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            return OtpResponse.builder()
                    .success(false)
                    .message("Email is already registered!")
                    .build();
        }

        // Check if OTP exists in storage
        OtpData existingOtp = otpStorage.get(email);
        if (existingOtp == null || existingOtp.userData == null) {
            return OtpResponse.builder()
                    .success(false)
                    .message("No OTP found. Please request a new OTP.")
                    .build();
        }

        // Generate new OTP
        String newOtp = String.format("%06d", new Random().nextInt(999999));

        // Update OTP in storage
        existingOtp.otp = newOtp;
        existingOtp.expiryTime = LocalDateTime.now().plusMinutes(5);
        otpStorage.put(email, existingOtp);

        // Print new OTP to console
        System.out.println("╔══════════════════════════════════════════════════════════╗");
        System.out.println("║     🔄 NEW OTP CODE FOR SCHEDULE PRO                    ║");
        System.out.println("║                                                          ║");
        System.out.println("║     Email: " + email);
        System.out.println("║     OTP:   " + newOtp);
        System.out.println("║                                                          ║");
        System.out.println("║     This OTP is valid for 5 minutes                      ║");
        System.out.println("╚══════════════════════════════════════════════════════════╝");

        // Send email
        try {
            emailService.sendOtpEmail(email, newOtp);
            System.out.println("✅ Email resent to: " + email);
        } catch (Exception e) {
            System.out.println("⚠️ Email not sent (check email configuration)");
            log.error("Email sending failed: {}", e.getMessage());
        }

        return OtpResponse.builder()
                .success(true)
                .message("OTP resent successfully. Check console for OTP code.")
                .otp(newOtp)
                .build();
    }

    // ============================================
    // LOGIN
    // ============================================
    @Transactional
    public LoginResponse authenticateUser(LoginRequest request) {
        String identifier = request.getIdentifier();
        String credential = request.getPassword();

        log.info("🔑 Login attempt for: {}", identifier);

        // ✅ Find user by email OR username
        User user = userRepository.findByEmail(identifier)
                .orElseGet(() -> userRepository.findByUsername(identifier)
                        .orElseThrow(() -> {
                            log.error("❌ User NOT found with: {}", identifier);
                            return new RuntimeException("Invalid email/username or password");
                        }));

        log.info("✅ User found: {}", user.getEmail());

        // ✅ If user is OAuth2 user (no password) and trying to login with password
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            log.error("⚠️ OAuth2 user trying to login with password: {}", user.getEmail());
            throw new RuntimeException("This account uses Google Login. Please use 'Login with Google'.");
        }

        // ✅ Regular user with password - authenticate
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), credential)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // ✅ Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return LoginResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .fullName(user.getFullName())
                        .role(user.getRole())
                        .phone(user.getPhone())
                        .profilePhoto(user.getProfilePhoto())
                        .department(user.getDepartment())
                        .position(user.getPosition())
                        .employeeId(user.getEmployeeId())
                        .build())
                .build();
    }

    // ============================================
    // GET USER BY EMAIL
    // ============================================
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    // ============================================
    // GET USER BY ID
    // ============================================
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // ============================================
    // FORGOT PASSWORD - GENERATE OTP
    // ============================================
    public String generateAndSendOTP(String email) {
        log.info("🔐 Generating password reset OTP for: {}", email);

        try {
            String otp = String.format("%06d", new Random().nextInt(999999));

            OtpData otpData = new OtpData();
            otpData.otp = otp;
            otpData.expiryTime = LocalDateTime.now().plusMinutes(5);
            otpStorage.put(email, otpData);

            System.out.println("=========================================");
            System.out.println("🔐 PASSWORD RESET OTP");
            System.out.println("Email: " + email);
            System.out.println("OTP: " + otp);
            System.out.println("Valid for 5 minutes");
            System.out.println("=========================================");

            // ✅ Send email
            emailService.sendOtpEmail(email, otp);
            System.out.println("✅ Password reset email sent to: " + email);

            return otp;

        } catch (Exception e) {
            log.error("❌ Error in generateAndSendOTP: {}", e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    // ============================================
    // FORGOT PASSWORD - VERIFY OTP
    // ============================================
    public boolean verifyOTP(String email, String otp) {
        log.info("🔐 Verifying password reset OTP for: {}", email);

        OtpData otpData = otpStorage.get(email);

        if (otpData == null) {
            log.warn("❌ No OTP found for: {}", email);
            return false;
        }

        if (otpData.expiryTime.isBefore(LocalDateTime.now())) {
            otpStorage.remove(email);
            log.warn("❌ OTP expired for: {}", email);
            return false;
        }

        boolean isValid = otpData.otp.equals(otp);
        log.info("OTP verification {} for: {}", isValid ? "✅ SUCCESS" : "❌ FAILED", email);
        return isValid;
    }

    // ============================================
    // FORGOT PASSWORD - RESET PASSWORD
    // ============================================
    @Transactional
    public void resetPassword(String email, String newPassword) {
        log.info("🔑 Resetting password for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        otpStorage.remove(email);
        log.info("✅ Password reset successfully for: {}", email);
    }

    // ============================================
    // OAUTH2 - CREATE OR UPDATE USER
    // ============================================
// ============================================
// OAUTH2 - CREATE OR UPDATE USER
// ============================================
    @Transactional
    public User createOrUpdateOAuth2User(String provider, String providerId, String email, String name, String profilePhoto) {
        log.info("🔐 Creating/Updating OAuth2 user: {} - {}", provider, email);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setProfilePhoto(profilePhoto != null ? profilePhoto : user.getProfilePhoto());
            user.setLastLogin(LocalDateTime.now());
            user.setIsVerified(true);
            log.info("✅ Updated existing user: {}", email);
            return userRepository.save(user);
        }

        String username = email.split("@")[0];
        int counter = 1;
        String baseUsername = username;
        while (userRepository.existsByUsername(username)) {
            username = baseUsername + counter++;
        }

        user = User.builder()
                .username(username)
                .email(email)
                .password(null)
                .fullName(name != null ? name : email)
                .role("EMPLOYEE")
                .provider(provider)
                .providerId(providerId)
                .profilePhoto(profilePhoto)
                .isActive(true)
                .isVerified(true)
                .joinDate(LocalDate.now())
                .employeeId("OAUTH-" + System.currentTimeMillis())
                .createdAt(LocalDateTime.now())
                .lastLogin(LocalDateTime.now())
                .build();

        log.info("✅ Created new OAuth2 user: {}", email);
        return userRepository.save(user);
    }

    // ============================================
    // INNER CLASS
    // ============================================
    private static class OtpData {
        public SendOtpRequest userData;
        String otp;
        LocalDateTime expiryTime;
    }
    // ============================================
// GENERATE EMPLOYEE ID BASED ON ROLE
// ============================================
    private String generateEmployeeId(String role) {
        String prefix = "EMP-";
        if ("ADMIN".equalsIgnoreCase(role)) {
            prefix = "ADMIN-";
        } else if ("MANAGER".equalsIgnoreCase(role)) {
            prefix = "MGR-";
        }
        return prefix + System.currentTimeMillis();
    }
}