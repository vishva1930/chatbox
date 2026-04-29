package com.chatbox.controller;

import com.chatbox.entity.User;
import com.chatbox.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{currentUserId}")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(@PathVariable Long currentUserId) {
        List<User> users = userService.getAllUsersExcept(currentUserId);
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("online", user.isOnline());
            map.put("lastSeen", user.getLastSeen());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(userList);
    }

    @GetMapping("/online")
    public ResponseEntity<List<Map<String, Object>>> getOnlineUsers() {
        List<User> users = userService.getOnlineUsers();
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("online", user.isOnline());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(userList);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestParam boolean online) {
        userService.setUserOnline(id, online);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Status updated");
        return ResponseEntity.ok(response);
    }
}
