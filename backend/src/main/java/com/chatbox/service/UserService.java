package com.chatbox.service;

import com.chatbox.dto.LoginRequest;
import com.chatbox.dto.RegisterRequest;
import com.chatbox.entity.User;
import com.chatbox.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Map<String, Object> register(RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        if (userRepository.existsByUsername(request.getUsername())) {
            response.put("success", false);
            response.put("message", "Username already exists");
            return response;
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already exists");
            return response;
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .online(false)
                .build();

        User savedUser = userRepository.save(user);

        response.put("success", true);
        response.put("message", "Registration successful");
        response.put("userId", savedUser.getId());
        response.put("username", savedUser.getUsername());
        return response;
    }

    public Map<String, Object> login(LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid password");
            return response;
        }

        // Set user online
        user.setOnline(true);
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Login successful");
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        return response;
    }

    public List<User> getAllUsersExcept(Long userId) {
        return userRepository.findByIdNot(userId);
    }

    public List<User> getOnlineUsers() {
        return userRepository.findByOnlineTrue();
    }

    public void setUserOnline(Long userId, boolean online) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setOnline(online);
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
}
