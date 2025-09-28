// Firebase SDK (Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyDkyiRV4s1mx-u0vXTFugt1VD_Ki7Sl7Sw",
  authDomain: "chat-29c7e.firebaseapp.com",
  projectId: "chat-29c7e",
  storageBucket: "chat-29c7e.firebasestorage.app",
  messagingSenderId: "191406446013",
  appId: "1:191406446013:web:a964c205dc0d2883ff6ed4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;

// DOM
const authScreen = document.getElementById('auth');
const profileScreen = document.getElementById('profile');
const chatScreen = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const chatTitle = document.getElementById('chatTitle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().username) {
      showChat();
      // Проверяем URL на наличие /user/USERNAME
      const path = window.location.pathname;
      const match = path.match(/^\/webmss\/user\/([a-z0-9_]+)$/);
      if (match) {
        const targetUsername = match[1];
        searchAndOpenChat(targetUsername);
      } else {
        showBotLoginNotification(userDoc.data().username);
      }
    } else {
      showProfileSetup();
    }
  } else {
    showAuth();
  }
});

// Screens
function showAuth() {
  authScreen.classList.remove('hidden');
  profileScreen.classList.add('hidden');
  chatScreen.classList.add('hidden');
}

function showProfileSetup() {
  authScreen.classList.add('hidden');
  profileScreen.classList.remove('hidden');
  chatScreen.classList.add('hidden');
}

function showChat() {
  authScreen.classList.add('hidden');
  profileScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
}

// Google Login
async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    alert('Login failed: ' + e.message);
  }
}

// Set username
async function setUsername() {
  const input = document.getElementById('usernameInput');
  const errorEl = document.getElementById('usernameError');
  const username = input.value.trim().toLowerCase();

  if (username.length < 5 || username.length > 32) {
    errorEl.textContent = 'Username must be 5–32 characters.';
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errorEl.textContent = 'Only English letters, digits, and underscores.';
    return;
  }

  const usernameDoc = await getDoc(doc(db, 'usernames', username));
  if (usernameDoc.exists()) {
    errorEl.textContent = 'Username already taken.';
    return;
  }

  await setDoc(doc(db, 'usernames', username), { uid: currentUser.uid });
  await setDoc(doc(db, 'users', currentUser.uid), {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: currentUser.displayName,
    photoURL: currentUser.photoURL,
    username: username
  }, { merge: true });

  errorEl.textContent = '';
  showChat();
  setTimeout(() => {
    document.getElementById('botChatItem')?.click();
  }, 300);
}

// Bot notification with email + username
function showBotLoginNotification(username) {
  chatTitle.textContent = 'FLYNET BOT';
  messagesDiv.innerHTML = `
    <div class="msg in">
      👋 Hello! I'm <strong>FLYNET BOT</strong> (flynetccbot).<br><br>
      🔔 <strong>New login detected!</strong><br>
      Email: <code>${currentUser.email}</code><br>
      Username: <code>@${username}</code><br><br>
      Your profile link:<br>
      <a href="https://submistik.github.io/webmss/user/${username}" target="_blank">
        https://submistik.github.io/webmss/user/${username}
      </a>
    </div>
  `;
}

// Open bot chat
document.getElementById('botChatItem')?.addEventListener('click', () => {
  showBotLoginNotification(currentUser?.username || 'user');
});

// Search user
async function searchUser() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const docSnap = await getDoc(doc(db, 'usernames', query));
  if (docSnap.exists()) {
    const userDoc = await getDoc(doc(db, 'users', docSnap.data().uid));
    if (userDoc.exists()) {
      const user = userDoc.data();
      openChatWithUser(user);
    }
  } else {
    alert(`User @${query} not found.`);
  }
}

// Open chat with user
function openChatWithUser(user) {
  chatTitle.textContent = user.displayName;
  messagesDiv.innerHTML = `<div class="msg in">Chat with @${user.username} is ready.</div>`;
  // Здесь можно реализовать реальный чат через Firestore
}

// Search by URL
async function searchAndOpenChat(username) {
  const docSnap = await getDoc(doc(db, 'usernames', username));
  if (docSnap.exists()) {
    const userDoc = await getDoc(doc(db, 'users', docSnap.data().uid));
    if (userDoc.exists()) {
      openChatWithUser(userDoc.data());
      return;
    }
  }
  // Пользователь не найден
  chatTitle.textContent = 'Error';
  messagesDiv.innerHTML = `
    <div class="msg in" style="color:#f44336;">
      ❌ User <code>@${username}</code> not found.<br>
      The link may be incorrect or the user hasn't set a username yet.
    </div>
  `;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('googleLoginBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('saveUsernameBtn')?.addEventListener('click', setUsername);
  searchBtn?.addEventListener('click', searchUser);
  searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUser();
  });
  document.getElementById('backBtn')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('show');
  });
});
