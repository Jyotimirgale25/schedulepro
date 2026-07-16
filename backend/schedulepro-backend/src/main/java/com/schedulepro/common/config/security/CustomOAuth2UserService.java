package com.schedulepro.common.config.security;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        try {
            System.out.println("🔐🔐🔐 loadUser STARTED!");

            OAuth2User oAuth2User = super.loadUser(userRequest);
            System.out.println("✅ OAuth2User loaded: " + oAuth2User.getAttributes());

            Map<String, Object> attributes = oAuth2User.getAttributes();
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            String picture = (String) attributes.get("picture");
            String providerId = (String) attributes.get("sub");

            System.out.println("📧 Email: " + email);
            System.out.println("👤 Name: " + name);

            if (email == null) {
                throw new OAuth2AuthenticationException("Email not found from Google");
            }

            // ✅ Create or update user
            User user = createOrUpdateUser(email, name, picture, providerId);
            System.out.println("✅ User processed: " + user.getEmail());

            return new CustomOAuth2User(oAuth2User, user);

        } catch (Exception e) {
            System.err.println("❌❌❌ OAUTH2 ERROR: " + e.getMessage());
            e.printStackTrace();
            log.error("OAuth2 UserService Error", e);
            throw e;
        }
    }

    private User createOrUpdateUser(String email, String name, String picture, String providerId) {
        try {
            Optional<User> existingUser = userRepository.findByEmail(email);

            if (existingUser.isPresent()) {
                User user = existingUser.get();
                System.out.println("✅ User already exists: " + email);
                user.setLastLogin(LocalDateTime.now());
                return userRepository.save(user);
            }

            User user = new User();
            user.setEmail(email);
            user.setUsername(email);
            user.setFullName(name != null ? name : "Google User");
            user.setPassword(null);
            user.setRole("EMPLOYEE");
            user.setIsActive(true);
            user.setCreatedAt(LocalDateTime.now());
            user.setJoinDate(LocalDateTime.now().toLocalDate());
            user.setEmployeeId("OAUTH-" + System.currentTimeMillis());
            user.setProfilePhoto(picture);
            user.setProvider("google");
            user.setProviderId(providerId);

            System.out.println("✅ New user saved: " + email);
            return userRepository.save(user);

        } catch (Exception e) {
            System.err.println("❌ Error saving user: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}