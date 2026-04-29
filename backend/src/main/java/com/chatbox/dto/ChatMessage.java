package com.chatbox.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long senderId;
    private Long receiverId;
    private String content;
    private String timestamp;
    private String senderName;
}
