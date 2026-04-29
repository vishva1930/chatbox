/* ============================================================
   ChatBox — auth.js
   Login & Registration form handling
   ============================================================ */

const API_BASE = 'http://localhost:8080/api';

document.addEventListener('DOMContentLoaded', () => {

    if (sessionStorage.getItem('chatbox_user')) {
        window.location.href = 'chat.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');


    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        clearErrors();
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
        clearErrors();
    });


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const errorEl = document.getElementById('loginError');
        errorEl.textContent = '';
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Signing in...';

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem('chatbox_user', JSON.stringify({
                    id: data.userId,
                    username: data.username
                }));
                window.location.href = 'chat.html';
            } else {
                errorEl.textContent = data.message || 'Login failed';
            }
        } catch (err) {
            errorEl.textContent = 'Cannot connect to server. Make sure the backend is running.';
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Sign In';
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('registerBtn');
        const errorEl = document.getElementById('registerError');
        const successEl = document.getElementById('registerSuccess');
        errorEl.textContent = '';
        successEl.textContent = '';
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Creating account...';

        const username = document.getElementById('regUsername').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (data.success) {
                successEl.textContent = 'Account created! Redirecting to login...';
                setTimeout(() => {
                    registerForm.classList.remove('active');
                    loginForm.classList.add('active');
                    clearErrors();
                    document.getElementById('loginUsername').value = username;
                }, 1500);
            } else {
                errorEl.textContent = data.message || 'Registration failed';
            }
        } catch (err) {
            errorEl.textContent = 'Cannot connect to server. Make sure the backend is running.';
        } finally {
            btn.disabled = false;
            btn.querySelector('span').textContent = 'Create Account';
        }
    });

    function clearErrors() {
        document.getElementById('loginError').textContent = '';
        document.getElementById('registerError').textContent = '';
        document.getElementById('registerSuccess').textContent = '';
    }
});
