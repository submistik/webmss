// Firebase SDK (Modular via CDN)
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
  getDoc
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Firebase Config
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

// Show screens
function showAuth() {
  document.getElementById('auth')?.classList.remove('hidden');
  document.getElementById('profile')?.classList.add('hidden');
  document.getElementById('chat')?.classList.add('hidden');
}

function showProfileSetup() {
  document.getElementById('auth')?.classList.add('hidden');
  document.getElementById('profile')?.classList.remove('hidden');
  document.getElementById('chat')?.classList.add('hidden');
}

function showChat() {
  document.getElementById('auth')?.classList.add('hidden');
  document.getElementById('profile')?.classList.add('hidden');
  document.getElementById('chat')?.classList.remove('hidden');
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
  if (!input || !errorEl) return;

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

  // Open bot after delay
  setTimeout(() => {
    const botItem = document.getElementById('botChatItem');
    if (botItem) botItem.click();
  }, 300);
}

// Bot notification
function showBotLoginNotification(username) {
  const chatTitle = document.getElementById('chatTitle');
  const messagesDiv = document.getElementById('messages');
  if (!chatTitle || !messagesDiv) return;

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

// Open chat with user
function openChatWithUser(user) {
  const chatTitle = document.getElementById('chatTitle');
  const messagesDiv = document.getElementById('messages');
  if (!chatTitle || !messagesDiv) return;

  chatTitle.textContent = user.displayName;
  messagesDiv.innerHTML = `<div class="msg in">Chat with @${user.username} is ready.</div>`;
}

// Search user
async function searchUser() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  const docSnap = await getDoc(doc(db, 'usernames', query));
  if (docSnap.exists()) {
    const userDoc = await getDoc(doc(db, 'users', docSnap.data().uid));
    if (userDoc.exists()) {
      openChatWithUser(userDoc.data());
      return;
    }
  }
  alert(`User @${query} not found.`);
}

// Handle URL: /webmss/user/USERNAME
async function handleUrlUsername() {
  const path = window.location.pathname;
  const match = path.match(/^\/webmss\/user\/([a-z0-9_]+)$/);
  if (!match) return;

  const username = match[1];
  const docSnap = await getDoc(doc(db, 'usernames', username));
  const chatTitle = document.getElementById('chatTitle');
  const messagesDiv = document.getElementById('messages');

  if (docSnap.exists()) {
    const userDoc = await getDoc(doc(db, 'users', docSnap.data().uid));
    if (userDoc.exists()) {
      openChatWithUser(userDoc.data());
      return;
    }
  }

  // User not found
  if (chatTitle && messagesDiv) {
    chatTitle.textContent = 'Error';
    messagesDiv.innerHTML = `
      <div class="msg in" style="color:#f44336;">
        ❌ User <code>@${username}</code> not found.<br>
        The link may be incorrect or the user hasn't set a username yet.
      </div>
    `;
  }
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().username) {
      showChat();
      handleUrlUsername();
    } else {
      showProfileSetup();
    }
  } else {
    showAuth();
  }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Auth
  document.getElementById('googleLoginBtn')?.addEventListener('click', signInWithGoogle);

  // Profile
  document.getElementById('saveUsernameBtn')?.addEventListener('click', setUsername);

  // Search
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  if (searchBtn) searchBtn.addEventListener('click', searchUser);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchUser();
    });
  }

  // Back button
  document.getElementById('backBtn')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.add('show');
  });

  // Bot chat
  document.getElementById('botChatItem')?.addEventListener('click', () => {
    if (currentUser && currentUser.username) {
      showBotLoginNotification(currentUser.username);
    }
  });
});
