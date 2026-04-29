package com.chatbox.controller;

import com.chatbox.dto.ChatMessage;
import com.chatbox.entity.Message;
import com.chatbox.entity.User;
import com.chatbox.service.MessageService;
import com.chatbox.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;
    private final UserService userService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        // Save message to database
        Message savedMessage = messageService.saveMessage(
                chatMessage.getSenderId(),
                chatMessage.getReceiverId(),
                chatMessage.getContent()
        );

        // Get sender name
        Optional<User> sender = userService.findById(chatMessage.getSenderId());
        chatMessage.setSenderName(sender.map(User::getUsername).orElse("Unknown"));
        chatMessage.setTimestamp(savedMessage.getTimestamp().toString());

        // Send to receiver's private queue
        messagingTemplate.convertAndSend(
                "/queue/messages/" + chatMessage.getReceiverId(),
                chatMessage
        );

        // Send back to sender for confirmation
        messagingTemplate.convertAndSend(
                "/queue/messages/" + chatMessage.getSenderId(),
                chatMessage
        );
    }

    @MessageMapping("/chat.online")
    public void userOnline(@Payload ChatMessage chatMessage) {
        userService.setUserOnline(chatMessage.getSenderId(), true);

        // Broadcast online status to all
        messagingTemplate.convertAndSend("/topic/online", chatMessage);
    }

    @MessageMapping("/chat.offline")
    public void userOffline(@Payload ChatMessage chatMessage) {
        userService.setUserOnline(chatMessage.getSenderId(), false);

        // Broadcast offline status to all
        messagingTemplate.convertAndSend("/topic/online", chatMessage);
    }
}
