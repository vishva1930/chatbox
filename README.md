
# 💬 ChatBox — Real-Time Chat Application

A modern **WhatsApp-like** real-time chat application built with **Spring Boot**, **MySQL**, **WebSocket (STOMP/SockJS)**, and a **vanilla HTML/CSS/JS** frontend.

---

## 📂 Project Structure

```
chatbox/
├── backend/                          # Spring Boot project
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/chatbox/
│       │   ├── ChatboxApplication.java
│       │   ├── config/
│       │   │   ├── WebSocketConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   └── CorsConfig.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── UserController.java
│       │   │   ├── MessageController.java
│       │   │   └── ChatController.java
│       │   ├── dto/
│       │   │   ├── ChatMessage.java
│       │   │   ├── LoginRequest.java
│       │   │   └── RegisterRequest.java
│       │   ├── entity/
│       │   │   ├── User.java
│       │   │   └── Message.java
│       │   ├── repository/
│       │   │   ├── UserRepository.java
│       │   │   └── MessageRepository.java
│       │   └── service/
│       │       ├── UserService.java
│       │       └── MessageService.java
│       └── resources/
│           └── application.properties
├── frontend/                         # Static HTML/CSS/JS
│   ├── index.html                    # Login / Register page
│   ├── chat.html                     # Chat interface
│   ├── styles.css                    # Dark theme styles
│   ├── auth.js                       # Auth logic
│   └── chat.js                       # WebSocket chat client
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites

| Tool   | Version   |
|--------|-----------|
| Java   | 17+       |
| Maven  | 3.8+      |
| MySQL  | 8.0+      |
| Browser| Any modern|

### Step 1 — Create MySQL Database

```sql
CREATE DATABASE chatbox;
```

> The tables are auto-created by Hibernate on first run (`ddl-auto=update`).

If you prefer to create them manually:

```sql
USE chatbox;

CREATE TABLE users (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    online     BOOLEAN DEFAULT FALSE,
    last_seen  DATETIME
);

CREATE TABLE messages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id   BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content     TEXT NOT NULL,
    timestamp   DATETIME NOT NULL,
    FOREIGN KEY (sender_id)   REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

### Step 2 — Configure Database Credentials

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

Change the username/password to match your MySQL setup.

### Step 3 — Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The server starts on **http://localhost:8080**.

### Step 4 — Open the Frontend

Open `frontend/index.html` in your browser.  
Or use VS Code **Live Server** extension (right-click → "Open with Live Server").

### Step 5 — Test

1. **Register** two accounts (open two browser tabs/windows).
2. **Login** with each account in a separate tab.
3. Select a user from the sidebar and **start chatting**!

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint             | Body                                      | Description   |
|--------|----------------------|--------------------------------------------|---------------|
| POST   | `/api/auth/register` | `{ "username", "email", "password" }`      | Register user |
| POST   | `/api/auth/login`    | `{ "username", "password" }`               | Login user    |

### Users

| Method | Endpoint                      | Description                   |
|--------|-------------------------------|-------------------------------|
| GET    | `/api/users/{currentUserId}`  | Get all users except current  |
| GET    | `/api/users/online`           | Get online users              |
| PUT    | `/api/users/{id}/status?online=true/false` | Update online status |

### Messages

| Method | Endpoint                        | Description                         |
|--------|---------------------------------|-------------------------------------|
| GET    | `/api/messages/{userId1}/{userId2}` | Get chat history between two users |

### WebSocket

| Destination          | Type      | Description                     |
|----------------------|-----------|---------------------------------|
| `/ws`                | Endpoint  | STOMP/SockJS connection         |
| `/app/chat.send`     | Send      | Send a chat message             |
| `/app/chat.online`   | Send      | Announce user is online         |
| `/app/chat.offline`  | Send      | Announce user is offline        |
| `/queue/messages/{userId}` | Subscribe | Receive private messages  |
| `/topic/online`      | Subscribe | Receive online status updates   |

---

## ✨ Features

- ✅ User registration & login with **BCrypt** password hashing
- ✅ **Real-time messaging** via WebSocket (STOMP over SockJS)
- ✅ Persistent messages stored in **MySQL**
- ✅ Chat history loaded on conversation open
- ✅ **Online/offline** status with live indicators
- ✅ Message timestamps
- ✅ Modern **dark theme** with glassmorphism & gradient accents
- ✅ Mobile-responsive design
- ✅ XSS protection (HTML escaping)
- ✅ Graceful disconnect on tab close
