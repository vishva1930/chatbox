package com.chatbox.controller;

import com.chatbox.entity.Message;
import com.chatbox.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/{userId1}/{userId2}")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory(
            @PathVariable Long userId1,
            @PathVariable Long userId2) {
        List<Message> messages = messageService.getChatHistory(userId1, userId2);
        List<Map<String, Object>> messageList = messages.stream().map(msg -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", msg.getId());
            map.put("senderId", msg.getSenderId());
            map.put("receiverId", msg.getReceiverId());
            map.put("content", msg.getContent());
            map.put("timestamp", msg.getTimestamp().toString());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(messageList);
    }
}
