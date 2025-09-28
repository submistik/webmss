// Firebase Config
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
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

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
let currentChatId = null;

// DOM
const authScreen = document.getElementById('auth');
const profileScreen = document.getElementById('profile');
const chatScreen = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const chatTitle = document.getElementById('chatTitle');

// Auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().username) {
      // Пользователь уже настроил username
      showChat();
      notifyBotAboutLogin(userDoc.data().username);
    } else {
      // Нужно выбрать username
      profileScreen.classList.remove('hidden');
      authScreen.classList.add('hidden');
    }
  } else {
    currentUser = null;
    authScreen.classList.remove('hidden');
    profileScreen.classList.add('hidden');
    chatScreen.classList.add('hidden');
  }
});

// Google Sign-In
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

  // Валидация
  if (username.length < 5 || username.length > 32) {
    errorEl.textContent = 'Username must be 5–32 characters.';
    return;
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    errorEl.textContent = 'Only English letters, digits, and underscores.';
    return;
  }

  // Проверка уникальности
  const usernameDoc = await getDoc(doc(db, 'usernames', username));
  if (usernameDoc.exists()) {
    errorEl.textContent = 'Username already taken.';
    return;
  }

  // Сохранение
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
  notifyBotAboutLogin(username);
}

function notifyBotAboutLogin(username) {
  // Открываем чат с ботом и показываем уведомление
  currentChatId = 'flynet_bot_chat';
  chatTitle.textContent = 'FLYNET BOT';
  messagesDiv.innerHTML = `
    <div class="msg">
      🔔 <strong>New login detected!</strong><br>
      User <code>@${username}</code> has signed in to FLYNET.<br><br>
      Welcome to FLYNET!<br>
      — <em>FLYNET BOT (flynetccbot)</em>
    </div>
  `;
}

function showChat() {
  authScreen.classList.add('hidden');
  profileScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
}

// Search user
async function searchUser() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const resultEl = document.getElementById('searchResult');
  if (!query) {
    resultEl.textContent = 'Enter a username to search.';
    return;
  }

  const doc = await getDoc(doc(db, 'usernames', query));
  if (doc.exists()) {
    const userDoc = await getDoc(doc(db, 'users', doc.data().uid));
    if (userDoc.exists()) {
      const user = userDoc.data();
      resultEl.innerHTML = `
        ✅ Found: <strong>${user.displayName}</strong><br>
        Username: <code>@${user.username}</code><br>
        <button class="btn" onclick="startChat('${user.uid}', '${user.displayName}')">Open Chat</button>
      `;
    }
  } else {
    resultEl.textContent = 'User not found.';
  }
}

function startChat(uid, name) {
  alert(`Chat with ${name} (UID: ${uid}) would open here.`);
  // Здесь можно реализовать открытие чата
}

// Make functions global
window.signInWithGoogle = signInWithGoogle;
window.setUsername = setUsername;
window.searchUser = searchUser;

// Open bot chat
window.openBotChat = function() {
  currentChatId = 'flynet_bot_chat';
  chatTitle.textContent = 'FLYNET BOT';
  messagesDiv.innerHTML = `
    <div class="msg">
      👋 Hello! I'm <strong>FLYNET BOT</strong> (flynetccbot).<br><br>
      I notify you about new logins and help you navigate FLYNET.<br><br>
      To find someone, type their username above.
    </div>
  `;
};
