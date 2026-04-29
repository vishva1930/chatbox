/* ============================================================
   ChatBox — chat.js
   WebSocket client, user list, messaging, online status
   ============================================================ */

const API_BASE = 'http://localhost:8080/api';
const WS_URL   = 'http://localhost:8080/ws';

// Avatar colour palette
const AVATAR_COLORS = [
    '#6c63ff', '#22c55e', '#f59e0b', '#ef4444',
    '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6',
    '#f97316', '#3b82f6', '#a855f7', '#10b981'
];

// ---- State ----
let currentUser   = null;   // { id, username }
let selectedUser  = null;   // { id, username, online }
let stompClient   = null;
let users         = [];
let pollingTimer  = null;

// ---- Kick off ----
document.addEventListener('DOMContentLoaded', () => {
    const stored = sessionStorage.getItem('chatbox_user');
    if (!stored) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(stored);
    document.getElementById('currentUsername').textContent = currentUser.username;

    initWebSocket();
    loadUsers();
    pollingTimer = setInterval(loadUsers, 5000);   // refresh user list every 5 s

    // Event listeners
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('backBtn').addEventListener('click', goBackToList);
    document.getElementById('searchUsers').addEventListener('input', filterUsers);
});

// ============================================================
//  WEBSOCKET
// ============================================================
function initWebSocket() {
    const socket = new SockJS(WS_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;   // silence STOMP logs

    stompClient.connect({}, () => {
        // Subscribe to private queue
        stompClient.subscribe('/queue/messages/' + currentUser.id, (msg) => {
            const chatMsg = JSON.parse(msg.body);
            handleIncomingMessage(chatMsg);
        });

        // Subscribe to online-status changes
        stompClient.subscribe('/topic/online', () => {
            loadUsers();
        });

        // Announce ourselves online
        stompClient.send('/app/chat.online', {}, JSON.stringify({
            senderId: currentUser.id,
            content: 'online'
        }));
    }, (err) => {
        console.error('WebSocket error', err);
        setTimeout(initWebSocket, 3000);
    });
}

function handleIncomingMessage(chatMsg) {
    // Only render if the message is part of the currently open conversation
    if (!selectedUser) return;

    const isSender   = chatMsg.senderId === currentUser.id;
    const isReceiver = chatMsg.receiverId === currentUser.id;
    const isRelevant =
        (isSender && chatMsg.receiverId === selectedUser.id) ||
        (isReceiver && chatMsg.senderId === selectedUser.id);

    if (!isRelevant) return;

    // Avoid duplicates: if we're the sender the message was already appended
    if (isSender) return;

    appendMessage(chatMsg, 'received');
    scrollToBottom();
}

// ============================================================
//  USERS
// ============================================================
async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE}/users/${currentUser.id}`);
        users = await res.json();
        renderUserList(users);
    } catch (e) {
        console.error('Failed to load users', e);
    }
}

function renderUserList(list) {
    const container = document.getElementById('userList');
    if (list.length === 0) {
        container.innerHTML = `
            <div class="user-list-loading">
                <p>No other users yet.<br>Register another account to start chatting!</p>
            </div>`;
        return;
    }

    container.innerHTML = list.map(user => {
        const color = AVATAR_COLORS[user.id % AVATAR_COLORS.length];
        const initial = user.username.charAt(0).toUpperCase();
        const isActive = selectedUser && selectedUser.id === user.id;
        const statusText = user.online ? 'Online' : (user.lastSeen ? 'Last seen ' + formatTime(user.lastSeen) : 'Offline');

        return `
        <div class="user-item ${isActive ? 'active' : ''}" data-id="${user.id}" data-username="${user.username}" data-online="${user.online}">
            <div class="user-avatar">
                <div class="avatar-letter" style="background:${color}">${initial}</div>
                <div class="online-dot ${user.online ? '' : 'offline'}"></div>
            </div>
            <div class="user-info">
                <div class="user-name">${escapeHtml(user.username)}</div>
                <div class="user-status">${statusText}</div>
            </div>
        </div>`;
    }).join('');

    // Attach click handlers
    container.querySelectorAll('.user-item').forEach(el => {
        el.addEventListener('click', () => {
            const userId   = parseInt(el.dataset.id);
            const username = el.dataset.username;
            const online   = el.dataset.online === 'true';
            selectUser({ id: userId, username, online });
        });
    });

    // Update chat header if selected user status changed
    if (selectedUser) {
        const updated = list.find(u => u.id === selectedUser.id);
        if (updated) {
            selectedUser.online = updated.online;
            const statusEl = document.getElementById('chatUserStatus');
            statusEl.textContent = updated.online ? 'Online' : 'Offline';
            statusEl.className = 'user-status-text' + (updated.online ? ' online' : '');
        }
    }
}

function filterUsers() {
    const term = document.getElementById('searchUsers').value.toLowerCase();
    const filtered = users.filter(u => u.username.toLowerCase().includes(term));
    renderUserList(filtered);
}

// ============================================================
//  SELECT USER & LOAD CHAT
// ============================================================
function selectUser(user) {
    selectedUser = user;

    // Highlight in sidebar
    document.querySelectorAll('.user-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.id) === user.id);
    });

    // Show chat panel, hide empty state
    document.getElementById('chatEmpty').style.display = 'none';
    document.getElementById('chatActive').style.display = 'flex';

    // Header
    const color = AVATAR_COLORS[user.id % AVATAR_COLORS.length];
    const avatarEl = document.getElementById('chatAvatar');
    avatarEl.style.background = color;
    document.getElementById('chatAvatarLetter').textContent = user.username.charAt(0).toUpperCase();
    document.getElementById('chatUserName').textContent = user.username;
    const statusEl = document.getElementById('chatUserStatus');
    statusEl.textContent = user.online ? 'Online' : 'Offline';
    statusEl.className = 'user-status-text' + (user.online ? ' online' : '');

    // Mobile: hide sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.add('hidden');
    }

    loadChatHistory();
    document.getElementById('messageInput').focus();
}

async function loadChatHistory() {
    const messagesEl = document.getElementById('chatMessages');
    const loadingEl  = document.getElementById('messagesLoading');
    messagesEl.innerHTML = '';
    messagesEl.appendChild(loadingEl);
    loadingEl.style.display = 'flex';

    try {
        const res = await fetch(`${API_BASE}/messages/${currentUser.id}/${selectedUser.id}`);
        const messages = await res.json();
        loadingEl.style.display = 'none';

        let lastDate = '';
        messages.forEach(msg => {
            const msgDate = formatDate(msg.timestamp);
            if (msgDate !== lastDate) {
                appendDateSeparator(msgDate);
                lastDate = msgDate;
            }
            const type = msg.senderId === currentUser.id ? 'sent' : 'received';
            appendMessage(msg, type);
        });

        scrollToBottom();
    } catch (e) {
        loadingEl.style.display = 'none';
        console.error('Failed to load chat history', e);
    }
}

// ============================================================
//  SEND MESSAGE
// ============================================================
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text  = input.value.trim();
    if (!text || !selectedUser || !stompClient || !stompClient.connected) return;

    const chatMsg = {
        senderId:   currentUser.id,
        receiverId: selectedUser.id,
        content:    text,
        timestamp:  new Date().toISOString()
    };

    // Send via WebSocket
    stompClient.send('/app/chat.send', {}, JSON.stringify(chatMsg));

    // Append immediately to own view
    appendMessage(chatMsg, 'sent');
    scrollToBottom();

    input.value = '';
    input.focus();
}

// ============================================================
//  DOM HELPERS
// ============================================================
function appendMessage(msg, type) {
    const messagesEl = document.getElementById('chatMessages');
    const row = document.createElement('div');
    row.className = `message-row ${type}`;

    const timeStr = formatTime(msg.timestamp);

    row.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${escapeHtml(msg.content)}</div>
            <div class="message-time">${timeStr}</div>
        </div>`;

    messagesEl.appendChild(row);
}

function appendDateSeparator(dateStr) {
    const messagesEl = document.getElementById('chatMessages');
    const sep = document.createElement('div');
    sep.className = 'date-separator';
    sep.innerHTML = `<span>${dateStr}</span>`;
    messagesEl.appendChild(sep);
}

function scrollToBottom() {
    const messagesEl = document.getElementById('chatMessages');
    requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
}

// ============================================================
//  LOGOUT
// ============================================================
function logout() {
    if (stompClient && stompClient.connected) {
        stompClient.send('/app/chat.offline', {}, JSON.stringify({
            senderId: currentUser.id,
            content: 'offline'
        }));

        // Also hit REST endpoint
        fetch(`${API_BASE}/users/${currentUser.id}/status?online=false`, { method: 'PUT' })
            .catch(() => {});
    }
    clearInterval(pollingTimer);
    sessionStorage.removeItem('chatbox_user');
    window.location.href = 'index.html';
}

// Mobile back button
function goBackToList() {
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('chatEmpty').style.display = 'flex';
    document.getElementById('chatActive').style.display = 'none';
    selectedUser = null;
}

// ============================================================
//  UTILITIES
// ============================================================
function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
        // Try parsing "2026-03-09T12:15:42" without timezone
        const parts = ts.replace('T', ' ').split(/[- :]/);
        if (parts.length >= 5) {
            const local = new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5] || 0);
            return local.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return ts;
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
        const parts = ts.split('T')[0];
        return parts || ts;
    }
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stompClient && stompClient.connected && currentUser) {
        stompClient.send('/app/chat.offline', {}, JSON.stringify({
            senderId: currentUser.id,
            content: 'offline'
        }));
        fetch(`${API_BASE}/users/${currentUser.id}/status?online=false`, {
            method: 'PUT',
            keepalive: true
        }).catch(() => {});
    }
});
