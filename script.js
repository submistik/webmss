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

// DOM Elements
const authScreen = document.getElementById('auth');
const profileScreen = document.getElementById('profile');
const chatScreen = document.getElementById('chat');
const messagesDiv = document.getElementById('messages');
const chatTitle = document.getElementById('chatTitle');
const searchResult = document.getElementById('searchResult');

// Auth State
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().username) {
      showChat();
      showBotLoginNotification(userDoc.data().username);
    } else {
      showProfileSetup();
    }
  } else {
    showAuth();
  }
});

// Show screens
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
  showBotLoginNotification(username);
}

// Bot notification
function showBotLoginNotification(username) {
  document.getElementById('botChatItem').click(); // имитация клика
}

// Open bot chat
document.getElementById('botChatItem')?.addEventListener('click', () => {
  chatTitle.textContent = 'FLYNET BOT';
  messagesDiv.innerHTML = `
    <div class="msg in">
      👋 Hello! I'm <strong>FLYNET BOT</strong> (flynetccbot).<br><br>
      🔔 <strong>New login detected!</strong><br>
      User <code>@${currentUser?.displayName?.toLowerCase() || 'user'}</code> has signed in.<br><br>
      To find someone, type their username above.
    </div>
  `;
});

// Search user
async function searchUser() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query) {
    searchResult.textContent = 'Enter a username to search.';
    return;
  }

  const docSnap = await getDoc(doc(db, 'usernames', query));
  if (docSnap.exists()) {
    const userDoc = await getDoc(doc(db, 'users', docSnap.data().uid));
    if (userDoc.exists()) {
      const user = userDoc.data();
      searchResult.innerHTML = `
        ✅ Found: <strong>${user.displayName}</strong><br>
        Username: <code>@${user.username}</code>
      `;
    }
  } else {
    searchResult.textContent = 'User not found.';
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('googleLoginBtn')?.addEventListener('click', signInWithGoogle);
  document.getElementById('saveUsernameBtn')?.addEventListener('click', setUsername);
  document.getElementById('searchBtn')?.addEventListener('click', searchUser);
  document.getElementById('backBtn')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.add('show');
  });
});
