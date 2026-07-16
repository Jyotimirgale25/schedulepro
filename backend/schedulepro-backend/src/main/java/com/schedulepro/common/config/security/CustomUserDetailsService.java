package com.schedulepro.common.config.security;

import com.schedulepro.auth.entity.User;
import com.schedulepro.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        System.out.println("🔍 loadUserByUsername called with: " + identifier);

        // ✅ Try to find by email first, then by username
        Optional<User> userOpt = userRepository.findByEmail(identifier);

        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(identifier);
        }

        User user = userOpt.orElseThrow(() -> {
            System.out.println("❌ User NOT found with: " + identifier);
            return new UsernameNotFoundException("User not found with: " + identifier);
        });

        System.out.println("✅ User found: " + user.getEmail());
        System.out.println("✅ Username: " + user.getUsername());
        System.out.println("✅ Role: " + user.getRole());
        System.out.println("✅ Password in DB: " + (user.getPassword() != null ? "HASHED" : "NULL (OAuth2 user)"));

        // ✅ Return user details with password (null for OAuth2 users is fine)
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),  // ← Can be null for OAuth2 users
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}