// ═══════════════════════════════════════════════════════════════════
//  EPIC CINEMATIC FILMS — CLIENT PORTAL
//  Firebase + Full Auth + Admin/Client functionality
// ═══════════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, deleteDoc,
  collection, query, where, getDocs, onSnapshot, serverTimestamp,
  orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────
// 🔧 REPLACE with your actual Firebase project config from:
// Firebase Console → Project Settings → Your apps → Web app → SDK setup
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBIl05mFeX9xPtztnU8NPtyBrLq2-IvhI",
  authDomain: "epic-cinematic-app.firebaseapp.com",
  projectId: "epic-cinematic-app",
  storageBucket: "epic-cinematic-app.firebasestorage.app",
  messagingSenderId: "419442946441",
  appId: "1:419442946441:web:693d58a6bcc28b39a0b158",
  measurementId: "G-YF1TEDXR7L"
};

// ─── ADMIN EMAIL (Epic Cinematic Films admin) ─────────────────────
const ADMIN_EMAIL = "admin@epiccinematicfilms.com";

// ─── INIT FIREBASE ────────────────────────────────────────────────
let app, auth, db;
let currentUser = null;
let isAdmin = false;
let currentPortal = null; // 'admin' or 'client'

// Demo mode flag — used when Firebase is not configured
let DEMO_MODE = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Check if using placeholder config
  if (firebaseConfig.apiKey.includes("DEMO") || firebaseConfig.apiKey.includes("REPLACE")) {
    DEMO_MODE = true;
    console.warn("⚠️ Demo mode: Using local storage simulation. Configure Firebase to enable full features.");
  }
} catch(e) {
  DEMO_MODE = true;
  console.warn("Firebase init failed — running in demo mode:", e.message);
}

// ═══════════════════════════════════════════════════════════════════
//  DEMO MODE — LocalStorage simulation when Firebase not configured
// ═══════════════════════════════════════════════════════════════════
const demoData = {
  users: {
    "admin@epiccinematicfilms.com": { uid: "admin001", email: "admin@epiccinematicfilms.com", company: "Epic Cinematic Films", contactName: "Admin", role: "admin", phone: "+254 715 150 894" },
    "demo@dealership.com": { uid: "client001", email: "demo@dealership.com", company: "Prestige Motors Kenya", contactName: "James Mwangi", role: "client", phone: "+254 722 000 001" }
  },
  shoots: [
    { id: "sh001", clientId: "client001", clientName: "Prestige Motors Kenya", shootType: "Premium Combo — 20 photos + 60-sec reel", shootDate: "2026-03-20", shootTime: "07:00", location: "Ngong Road Showroom", status: "confirmed", numVehicles: 3, vehicleDetails: "2023 Toyota Land Cruiser (White), 2022 Subaru Outback (Silver), 2021 Mercedes C200 (Black)", createdAt: { seconds: Date.now()/1000 } },
    { id: "sh002", clientId: "client001", clientName: "Prestige Motors Kenya", shootType: "Standard Package — 15 images", shootDate: "2026-02-15", shootTime: "09:00", location: "Westlands Lot", status: "completed", numVehicles: 5, vehicleDetails: "Various Toyota models", createdAt: { seconds: Date.now()/1000 - 2592000 } }
  ],
  briefs: [
    { id: "br001", clientId: "client001", clientName: "Prestige Motors Kenya", dealershipName: "Prestige Motors Kenya", location: "Ngong Road, Nairobi", primaryColor: "#1E3A5F", tagline: "Drive Your Dreams", brandValues: "Premium, Trustworthy, Modern", status: "approved", completionPct: 85, createdAt: { seconds: Date.now()/1000 } }
  ],
  feedback: [
    { id: "fb001", clientId: "client001", from: "Epic Cinematic Films", subject: "Post-Shoot Creative Recommendations", body: "After reviewing your brand brief and the recent shoot, we recommend leaning into golden hour lifestyle shots for your SUV lineup. The Toyota Prado in particular photographs beautifully in warm light. We suggest scheduling the next shoot at 5pm to capture that look consistently.\n\nAdditionally, we notice your Instagram posts perform better with captions that focus on lifestyle rather than specs — we can incorporate this into our next reel scripts.\n\nKeep the dark backgrounds for interior shots — this gives your brand a premium feel that matches your target buyer profile.", tags: ["creative", "strategy", "scheduling"], isRead: false, createdAt: { seconds: Date.now()/1000 - 86400 } }
  ],
  deliverables: [
    { id: "del001", clientId: "client001", title: "Toyota Prado VX — Premium Package", type: "photos", count: 20, driveLink: "https://drive.google.com", thumbnail: "🚙", date: "2026-02-18", shootId: "sh002" },
    { id: "del002", clientId: "client001", title: "Subaru Outback — 60-sec Reel", type: "video", duration: "0:62", driveLink: "https://drive.google.com", thumbnail: "🎬", date: "2026-02-18", shootId: "sh002" }
  ],
  invoices: [
    { id: "inv001", clientId: "client001", clientName: "Prestige Motors Kenya", number: "ECF-2026-001", amount: 14000, description: "Premium Combo Package — Feb 2026", status: "paid", dueDate: "2026-02-25", createdAt: { seconds: Date.now()/1000 - 2592000 } }
  ],
  clients: [
    { uid: "client001", company: "Prestige Motors Kenya", contactName: "James Mwangi", email: "demo@dealership.com", phone: "+254 722 000 001", status: "active", joinedAt: { seconds: Date.now()/1000 - 5184000 } }
  ]
};

// Demo auth simulation
let demoSession = JSON.parse(localStorage.getItem("ecf_demo_session") || "null");

// ═══════════════════════════════════════════════════════════════════
//  DOM READY
// ═══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
  setupSidebar();
  setupNavigation();
  setupBriefForm();
  setupShootForm();

  if (DEMO_MODE) {
    addDemoBanner();
    if (demoSession) resumeDemoSession(demoSession);
    else showScreen("auth-screen");
  } else {
    onAuthStateChanged(auth, handleAuthStateChange);
  }
});

// ─── AUTH STATE HANDLER ───────────────────────────────────────────
async function handleAuthStateChange(user) {
  if (user) {
    currentUser = user;
    const userDoc = await getUserDoc(user.uid);
    if (userDoc && userDoc.role === "admin") {
      isAdmin = true;
      loadAdminPortal(userDoc);
    } else {
      isAdmin = false;
      loadClientPortal(userDoc || { email: user.email, company: "My Brand", contactName: user.email });
    }
  } else {
    currentUser = null;
    isAdmin = false;
    showScreen("auth-screen");
  }
}

// ─── DEMO BANNER ─────────────────────────────────────────────────
function addDemoBanner() {
  const banner = document.createElement("div");
  banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#C9A84C;color:#0D0D0D;text-align:center;padding:6px 1rem;font-size:0.75rem;font-weight:600;letter-spacing:0.05em;";
  banner.innerHTML = "⚡ DEMO MODE — Configure Firebase in app.js to enable full features. &nbsp;|&nbsp; Admin: admin@epiccinematicfilms.com / admin123 &nbsp;|&nbsp; Client: demo@dealership.com / client123";
  document.body.appendChild(banner);
  document.querySelectorAll(".screen").forEach(s => s.style.paddingTop = "30px");
}

// ─── DEMO RESUME ─────────────────────────────────────────────────
function resumeDemoSession(session) {
  const user = demoData.users[session.email];
  if (!user) { showScreen("auth-screen"); return; }
  currentUser = user;
  isAdmin = user.role === "admin";
  if (isAdmin) loadAdminPortal(user);
  else loadClientPortal(user);
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH UI
// ═══════════════════════════════════════════════════════════════════
function setupAuthUI() {
  // Tabs
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab, .auth-form").forEach(el => el.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("auth-" + tab.dataset.tab).classList.add("active");
    });
  });

  // Login
  document.getElementById("btn-login").addEventListener("click", handleLogin);
  document.getElementById("login-password").addEventListener("keydown", e => { if(e.key==="Enter") handleLogin(); });

  // Register
  document.getElementById("btn-register").addEventListener("click", handleRegister);

  // Forgot password
  document.getElementById("btn-forgot").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    if (!email) { showError("login-error", "Please enter your email first."); return; }
    if (DEMO_MODE) { showToast("Password reset email sent (demo mode).", "info"); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent!", "success");
    } catch(e) { showError("login-error", e.message); }
  });
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  if (!email || !pass) { showError("login-error", "Please fill in all fields."); return; }

  setButtonLoading("btn-login", true);

  if (DEMO_MODE) {
    // Demo auth
    const user = demoData.users[email];
    const validPasswords = { "admin@epiccinematicfilms.com": "admin123", "demo@dealership.com": "client123" };
    if (!user || validPasswords[email] !== pass) {
      showError("login-error", "Invalid email or password. Try admin@epiccinematicfilms.com / admin123");
      setButtonLoading("btn-login", false); return;
    }
    demoSession = { email };
    localStorage.setItem("ecf_demo_session", JSON.stringify(demoSession));
    currentUser = user; isAdmin = user.role === "admin";
    setButtonLoading("btn-login", false);
    if (isAdmin) loadAdminPortal(user);
    else loadClientPortal(user);
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch(e) {
    const msgs = { "auth/user-not-found": "No account found with this email.", "auth/wrong-password": "Incorrect password.", "auth/invalid-email": "Invalid email address.", "auth/too-many-requests": "Too many attempts. Try again later." };
    showError("login-error", msgs[e.code] || e.message);
  } finally { setButtonLoading("btn-login", false); }
}

async function handleRegister() {
  const company = document.getElementById("reg-company").value.trim();
  const name    = document.getElementById("reg-name").value.trim();
  const email   = document.getElementById("reg-email").value.trim();
  const phone   = document.getElementById("reg-phone").value.trim();
  const pass    = document.getElementById("reg-password").value;

  if (!company||!name||!email||!pass) { showError("reg-error","Please fill in all required fields."); return; }
  if (pass.length < 8) { showError("reg-error","Password must be at least 8 characters."); return; }

  setButtonLoading("btn-register", true);

  if (DEMO_MODE) {
    showError("reg-error","Registration is disabled in demo mode. Use the demo accounts.");
    setButtonLoading("btn-register", false); return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid, email, company, contactName: name, phone,
      role: "client", status: "active", joinedAt: serverTimestamp()
    });
    showToast("Account created! Welcome.", "success");
  } catch(e) {
    const msgs = { "auth/email-already-in-use": "An account with this email already exists.", "auth/weak-password": "Password is too weak." };
    showError("reg-error", msgs[e.code] || e.message);
  } finally { setButtonLoading("btn-register", false); }
}

// ═══════════════════════════════════════════════════════════════════
//  PORTAL LOADERS
// ═══════════════════════════════════════════════════════════════════
function loadAdminPortal(userData) {
  currentPortal = "admin";
  showScreen("admin-screen");
  document.getElementById("admin-user-name").textContent = userData.contactName || "Admin";
  loadAdminDashboard();
  loadAdminClients();
  loadAdminBriefs();
  loadAdminShoots();
  loadAdminFeedback();
  loadAdminDeliverables();
  loadAdminInvoices();
  setupAdminActions();
}

function loadClientPortal(userData) {
  currentPortal = "client";
  showScreen("client-screen");
  const company = userData.company || "My Brand";
  const name    = userData.contactName || userData.email;
  document.getElementById("client-brand-name").textContent = company.toUpperCase();
  document.getElementById("client-user-name").textContent = name;
  document.getElementById("client-welcome-name").textContent = `Welcome back, ${name.split(" ")[0]}`;
  document.getElementById("client-avatar-initials").textContent = getInitials(name);
  document.getElementById("profile-display-name").textContent = name;
  document.getElementById("profile-display-email").textContent = userData.email || "";
  document.getElementById("profile-avatar-display").textContent = getInitials(name);
  document.getElementById("profile-company").value = company;
  document.getElementById("profile-contact").value = name;
  document.getElementById("profile-phone").value = userData.phone || "";
  document.getElementById("profile-email").value = userData.email || "";
  const uid = DEMO_MODE ? currentUser.uid : currentUser.uid;
  loadClientDashboard(uid);
  loadClientShoots(uid);
  loadClientDeliverables(uid);
  loadClientFeedback(uid);
  loadClientInvoices(uid);
  setupClientActions(uid);
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN — DATA LOADERS
// ═══════════════════════════════════════════════════════════════════
async function loadAdminDashboard() {
  const [clients, shoots, briefs, invoices] = await Promise.all([
    getData("clients"), getData("shoots"), getData("briefs"), getData("invoices")
  ]);

  document.getElementById("stat-clients").textContent = clients.length;
  document.getElementById("stat-shoots").textContent = shoots.filter(s => s.status !== "completed").length;
  document.getElementById("stat-briefs").textContent = briefs.length;
  const monthRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
  document.getElementById("stat-revenue").textContent = "KES " + monthRevenue.toLocaleString();

  // Upcoming shoots
  const upcomingEl = document.getElementById("admin-upcoming-shoots");
  const upcoming = shoots.filter(s => s.status !== "completed").sort((a,b) => a.shootDate > b.shootDate ? 1 : -1).slice(0,4);
  upcomingEl.innerHTML = upcoming.length ? upcoming.map(s => `
    <div class="shoot-item">
      <div class="shoot-item-title">${s.clientName} — ${s.shootType}</div>
      <div class="shoot-item-meta">
        <span>📅 ${formatDate(s.shootDate)}</span>
        <span>🕒 ${formatTime(s.shootTime)}</span>
        <span>📍 ${s.location}</span>
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No upcoming shoots.</div>`;

  // Recent briefs
  const briefsEl = document.getElementById("admin-recent-briefs");
  const recent = briefs.slice(-3).reverse();
  briefsEl.innerHTML = recent.length ? recent.map(b => `
    <div class="shoot-item">
      <div class="shoot-item-title">${b.dealershipName || b.clientName}</div>
      <div class="shoot-item-meta">
        <span>Completion: ${b.completionPct || 0}%</span>
        <span class="badge ${b.status==="approved"?"badge-green":"badge-gold"}">${b.status || "pending"}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No briefs yet.</div>`;

  // Pending actions
  const actionsEl = document.getElementById("admin-pending-actions");
  const actions = [];
  briefs.filter(b => b.status !== "approved").forEach(b => actions.push({ dot:"gold", text:`Review brand brief from ${b.dealershipName || b.clientName}` }));
  shoots.filter(s => s.status === "requested").forEach(s => actions.push({ dot:"blue", text:`Confirm shoot for ${s.clientName} on ${formatDate(s.shootDate)}` }));
  invoices.filter(i => i.status === "unpaid").forEach(i => actions.push({ dot:"red", text:`Invoice ${i.number} from ${i.clientName} is unpaid` }));
  actionsEl.innerHTML = actions.length ? actions.map(a => `
    <div class="action-item">
      <div class="action-dot ${a.dot}"></div>
      <span>${a.text}</span>
    </div>`).join("") : `<div class="empty-state">All clear — no pending actions. ✓</div>`;

  // Notification count
  document.getElementById("admin-notif-count").textContent = actions.length;
}

async function loadAdminClients() {
  const clients = await getData("clients");
  const el = document.getElementById("admin-clients-list");
  el.innerHTML = clients.length ? clients.map(c => `
    <div class="card" onclick="openClientModal('${c.uid}')">
      <div class="card-header">
        <div>
          <div class="card-title">${c.company}</div>
          <div class="card-sub">${c.contactName}</div>
        </div>
        <span class="badge ${c.status==="active"?"badge-green":"badge-grey"}">${c.status || "active"}</span>
      </div>
      <div class="card-body">${c.email}<br/>${c.phone || ""}</div>
      <div class="card-footer">
        <span class="badge badge-gold">Client</span>
        <span class="badge badge-grey">${c.joinedAt ? "Joined " + formatDate(new Date(c.joinedAt.seconds*1000).toISOString().split("T")[0]) : "New"}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No clients yet. Invite your first client above.</div>`;
}

async function loadAdminBriefs() {
  const briefs = await getData("briefs");
  renderBriefs(briefs);
}

function renderBriefs(briefs) {
  const el = document.getElementById("admin-briefs-list");
  el.innerHTML = briefs.length ? briefs.map(b => `
    <div class="card" onclick="openBriefModal('${b.id}')">
      <div class="card-header">
        <div>
          <div class="card-title">${b.dealershipName || b.clientName || "Unknown"}</div>
          <div class="card-sub">${b.location || ""}</div>
        </div>
        <span class="badge ${b.status==="approved"?"badge-green":b.status==="rejected"?"badge-red":"badge-gold"}">${b.status || "pending"}</span>
      </div>
      <div class="card-body">
        <div style="margin-bottom:0.5rem">
          <div style="height:4px;background:var(--dark4);border-radius:2px;overflow:hidden">
            <div style="height:100%;width:${b.completionPct||0}%;background:var(--gold)"></div>
          </div>
          <span style="font-size:0.72rem;color:var(--text-dim)">Completion: ${b.completionPct||0}%</span>
        </div>
        ${b.tagline ? `<em style="font-size:0.8rem;color:var(--text-dim)">"${b.tagline}"</em>` : ""}
      </div>
      <div class="card-footer">
        <button class="btn-primary btn-sm" onclick="event.stopPropagation();approveBrief('${b.id}')">Approve</button>
        <button class="btn-ghost btn-sm" onclick="event.stopPropagation();openFeedbackModal('${b.id}','${b.clientId}','${b.dealershipName||b.clientName}')">Send Feedback</button>
      </div>
    </div>`).join("") : `<div class="empty-state">No brand briefs submitted yet.</div>`;
}

async function loadAdminShoots() {
  const shoots = await getData("shoots");
  const el = document.getElementById("admin-shoots-list");
  el.innerHTML = shoots.length ? shoots.map(s => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${s.clientName}</div>
          <div class="card-sub">${s.shootType}</div>
        </div>
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
      <div class="card-body">
        <div>📅 ${formatDate(s.shootDate)} at ${formatTime(s.shootTime)}</div>
        <div>📍 ${s.location}</div>
        <div>🚗 ${s.numVehicles} vehicle(s)</div>
        ${s.vehicleDetails ? `<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-dim)">${s.vehicleDetails}</div>` : ""}
      </div>
      <div class="card-footer">
        ${s.status==="requested"?`<button class="btn-primary btn-sm" onclick="confirmShoot('${s.id}')">Confirm</button>`:""}
        ${s.status==="confirmed"?`<button class="btn-primary btn-sm" onclick="completeShoot('${s.id}')">Mark Complete</button>`:""}
        <button class="btn-ghost btn-sm" onclick="openAddDeliverableModal('${s.id}','${s.clientId}','${s.clientName}')">Add Deliverable</button>
      </div>
    </div>`).join("") : `<div class="empty-state">No shoots yet.</div>`;
}

async function loadAdminFeedback() {
  const feedbacks = await getData("feedback");
  const el = document.getElementById("admin-feedback-list");
  el.innerHTML = feedbacks.length ? feedbacks.map(f => `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">${f.subject}</div>
          <div class="card-sub">To: ${f.clientName || "Client"}</div>
        </div>
        <span class="badge ${f.isRead?"badge-grey":"badge-gold"}">${f.isRead?"Read":"Unread"}</span>
      </div>
      <div class="card-body">${(f.body||"").substring(0,120)}...</div>
      <div class="card-footer">
        ${(f.tags||[]).map(t=>`<span class="badge badge-blue">${t}</span>`).join("")}
      </div>
    </div>`).join("") : `<div class="empty-state">No feedback sent yet.</div>`;
}

async function loadAdminDeliverables() {
  const items = await getData("deliverables");
  const el = document.getElementById("admin-gallery-list");
  el.innerHTML = items.length ? items.map(d => `
    <div class="card">
      <div style="font-size:2.5rem;text-align:center;padding:1rem;background:var(--dark4);border-radius:6px;margin-bottom:0.75rem">${d.thumbnail||"📁"}</div>
      <div class="card-title">${d.title}</div>
      <div class="card-sub">${d.clientName||""} · ${d.date||""}</div>
      <div class="card-footer">
        <span class="badge ${d.type==="video"?"badge-blue":"badge-gold"}">${d.type}</span>
        ${d.driveLink?`<a href="${d.driveLink}" target="_blank" class="badge badge-grey" style="text-decoration:none">Drive ↗</a>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No deliverables yet.</div>`;
}

async function loadAdminInvoices() {
  const invoices = await getData("invoices");
  const el = document.getElementById("admin-invoices-list");
  el.innerHTML = invoices.length ? invoices.map(i => `
    <div class="card invoice-card">
      <div class="invoice-header">
        <span class="invoice-number">${i.number}</span>
        <span class="badge ${i.status==="paid"?"badge-green":i.status==="overdue"?"badge-red":"badge-gold"}">${i.status}</span>
      </div>
      <div class="invoice-client">${i.clientName}</div>
      <div class="invoice-amount">KES ${(i.amount||0).toLocaleString()}</div>
      <div class="card-body" style="margin-top:0.5rem">${i.description || ""}</div>
      <div class="card-footer">
        <span class="badge badge-grey">Due: ${i.dueDate||"—"}</span>
        ${i.status!=="paid"?`<button class="btn-primary btn-sm" onclick="markInvoicePaid('${i.id}')">Mark Paid</button>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No invoices yet.</div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  CLIENT — DATA LOADERS
// ═══════════════════════════════════════════════════════════════════
async function loadClientDashboard(uid) {
  const [shoots, deliverables, feedback, invoices] = await Promise.all([
    getData("shoots", uid), getData("deliverables", uid),
    getData("feedback", uid), getData("invoices", uid)
  ]);

  document.getElementById("cstat-shoots").textContent = shoots.length;
  document.getElementById("cstat-deliverables").textContent = deliverables.length;
  const unread = feedback.filter(f => !f.isRead).length;
  document.getElementById("cstat-feedback").textContent = unread || "0";
  document.getElementById("cstat-status").textContent = "Active";

  // Feedback badge
  if (unread > 0) {
    document.getElementById("client-feedback-badge").textContent = unread;
    document.getElementById("client-feedback-badge").classList.add("visible");
    document.getElementById("client-notif-count").textContent = unread;
  }

  // Next shoot
  const upcoming = shoots.filter(s => s.status !== "completed" && s.shootDate >= new Date().toISOString().split("T")[0]).sort((a,b) => a.shootDate > b.shootDate ? 1 : -1);
  const nextEl = document.getElementById("client-next-shoot");
  if (upcoming.length) {
    const s = upcoming[0];
    nextEl.innerHTML = `
      <div class="shoot-item" style="border:none;background:none;padding:0">
        <div class="shoot-item-title">${s.shootType}</div>
        <div class="shoot-item-meta">
          <span>📅 ${formatDate(s.shootDate)}</span>
          <span>🕒 ${formatTime(s.shootTime)}</span>
          <span>📍 ${s.location}</span>
        </div>
        <div style="margin-top:0.75rem"><span class="badge ${statusBadge(s.status)}">${s.status}</span></div>
      </div>`;
  } else { nextEl.innerHTML = `<div class="empty-state">No upcoming shoots. <a href="#" data-view="client-shoots">Schedule one →</a></div>`; }

  // Latest feedback
  const fbEl = document.getElementById("client-latest-feedback");
  if (feedback.length) {
    const f = feedback[0];
    fbEl.innerHTML = `
      <div class="feedback-card ${f.isRead?"":"unread"}" style="background:var(--dark4);padding:0.9rem">
        <div class="feedback-subject">${f.subject}</div>
        <div class="feedback-body">${(f.body||"").substring(0,150)}...</div>
        <div style="margin-top:0.5rem"><a href="#" class="panel-link" data-view="client-feedback">Read full →</a></div>
      </div>`;
  } else { fbEl.innerHTML = `<div class="empty-state">No feedback yet.</div>`; }

  // Recent deliverables
  const delEl = document.getElementById("client-recent-deliverables");
  if (deliverables.length) {
    delEl.innerHTML = deliverables.slice(-4).map(d => `
      <div class="deliverable-card">
        <div class="deliverable-thumb">${d.thumbnail||"📁"}</div>
        <div class="deliverable-info">
          <div class="deliverable-name">${d.title}</div>
          <div class="deliverable-meta">${d.type} · ${d.date||""}</div>
        </div>
      </div>`).join("");
  } else { delEl.innerHTML = `<div class="empty-state">No deliverables yet.</div>`; }
}

async function loadClientShoots(uid) {
  const shoots = await getData("shoots", uid);
  const el = document.getElementById("client-shoots-list");
  el.innerHTML = shoots.length ? shoots.map(s => `
    <div class="shoot-item">
      <div class="shoot-item-title">${s.shootType}</div>
      <div class="shoot-item-meta">
        <span>📅 ${formatDate(s.shootDate)}</span>
        <span>🕒 ${formatTime(s.shootTime)}</span>
        <span>📍 ${s.location}</span>
      </div>
      <div style="margin-top:0.4rem">
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
        ${s.numVehicles?`<span class="badge badge-grey" style="margin-left:0.3rem">${s.numVehicles} vehicle(s)</span>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No shoots yet.</div>`;
}

async function loadClientDeliverables(uid) {
  const items = await getData("deliverables", uid);
  const el = document.getElementById("client-deliverables-list");
  el.innerHTML = items.length ? items.map(d => `
    <div class="deliverable-card" onclick="${d.driveLink?`window.open('${d.driveLink}','_blank')`:""}" style="${d.driveLink?"cursor:pointer":""}">
      <div class="deliverable-thumb">${d.thumbnail||"📁"}</div>
      <div class="deliverable-info">
        <div class="deliverable-name">${d.title}</div>
        <div class="deliverable-meta">${d.type}${d.count?" · "+d.count+" images":""}${d.duration?" · "+d.duration:""} · ${d.date||""}</div>
        ${d.driveLink?`<div style="margin-top:0.4rem"><span class="badge badge-blue">Download ↗</span></div>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No deliverables yet. Your content will appear here after each shoot.</div>`;
}

async function loadClientFeedback(uid) {
  const items = await getData("feedback", uid);
  const el = document.getElementById("client-feedback-list");
  el.innerHTML = items.length ? items.map(f => `
    <div class="feedback-card ${f.isRead?"":"unread"}" onclick="markFeedbackRead('${f.id}','${uid}',this)">
      <div class="feedback-header">
        <span class="feedback-from">Epic Cinematic Films</span>
        <span class="feedback-date">${f.createdAt ? formatRelativeDate(f.createdAt.seconds) : ""}</span>
      </div>
      <div class="feedback-subject">${f.subject}</div>
      <div class="feedback-body" style="white-space:pre-line">${f.body||""}</div>
      <div class="feedback-tags">${(f.tags||[]).map(t=>`<span class="badge badge-gold">${t}</span>`).join("")}</div>
    </div>`).join("") : `<div class="empty-state">No feedback yet from Epic Cinematic Films.</div>`;
}

async function loadClientInvoices(uid) {
  const items = await getData("invoices", uid);
  const el = document.getElementById("client-invoices-list");
  el.innerHTML = items.length ? items.map(i => `
    <div class="invoice-card card">
      <div class="invoice-header">
        <span class="invoice-number">${i.number}</span>
        <span class="badge ${i.status==="paid"?"badge-green":i.status==="overdue"?"badge-red":"badge-gold"}">${i.status}</span>
      </div>
      <div class="invoice-amount">KES ${(i.amount||0).toLocaleString()}</div>
      <div class="card-body" style="margin-top:0.4rem">${i.description || ""}</div>
      <div class="card-footer">
        <span class="badge badge-grey">Due: ${i.dueDate||"—"}</span>
        ${i.status!=="paid"?`<a href="tel:+254715150894" class="badge badge-blue" style="text-decoration:none;cursor:pointer">Pay via M-Pesa ↗</a>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No invoices yet.</div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  FORMS
// ═══════════════════════════════════════════════════════════════════
function setupBriefForm() {
  const form = document.getElementById("brand-brief-form");
  if (!form) return;

  // Live completion tracker
  form.addEventListener("change", updateBriefCompletion);
  form.addEventListener("input", updateBriefCompletion);

  // Color picker sync
  form.querySelectorAll(".color-picker").forEach(picker => {
    const hex = picker.parentElement.querySelector(".color-hex");
    picker.addEventListener("input", () => { hex.value = picker.value; });
    hex.addEventListener("input", () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) picker.value = hex.value;
    });
  });

  // Save draft
  document.getElementById("btn-save-draft").addEventListener("click", () => {
    const data = collectFormData(form);
    localStorage.setItem("ecf_brief_draft_" + (currentUser?.uid||"guest"), JSON.stringify(data));
    showToast("Draft saved locally.", "info");
  });

  // Load draft
  const draft = localStorage.getItem("ecf_brief_draft_" + (currentUser?.uid||"guest"));
  if (draft) {
    try { populateForm(form, JSON.parse(draft)); updateBriefCompletion(); } catch(e) {}
  }

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    data.clientId = currentUser?.uid || "guest";
    data.clientName = document.getElementById("client-brand-name")?.textContent || "";
    data.status = "pending";
    data.completionPct = parseInt(document.getElementById("brief-pct")?.textContent) || 0;
    data.createdAt = DEMO_MODE ? { seconds: Date.now()/1000 } : serverTimestamp();

    if (DEMO_MODE) {
      const id = "br_" + Date.now();
      demoData.briefs.push({ id, ...data });
      showToast("Brand brief submitted successfully!", "success");
      // Notify admin
      demoData.feedback.unshift({ id:"auto_"+Date.now(), clientId:"admin001", subject:"New brand brief submitted", body:`${data.dealershipName} has submitted their brand brief.`, isRead:false, createdAt:{ seconds:Date.now()/1000 } });
    } else {
      try {
        await addDoc(collection(db, "briefs"), data);
        showToast("Brand brief submitted!", "success");
      } catch(err) { showToast("Failed to submit brief: " + err.message, "error"); return; }
    }
    localStorage.removeItem("ecf_brief_draft_" + (currentUser?.uid||"guest"));
  });
}

function updateBriefCompletion() {
  const form = document.getElementById("brand-brief-form");
  if (!form) return;
  const inputs = form.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=color]), textarea, select");
  const checkGroups = form.querySelectorAll("[name]");
  let filled = 0; let total = inputs.length;
  inputs.forEach(el => { if (el.value.trim()) filled++; });
  const pct = Math.min(100, Math.round((filled / total) * 100));
  document.getElementById("brief-pct").textContent = pct + "%";
  document.getElementById("brief-fill").style.width = pct + "%";
}

function setupShootForm() {
  const form = document.getElementById("shoot-booking-form");
  if (!form) return;

  // Set min date to today
  const dateInput = form.querySelector("[name=shootDate]");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectFormData(form);
    data.clientId = currentUser?.uid || "guest";
    data.clientName = document.getElementById("client-brand-name")?.textContent || "";
    data.status = "requested";
    data.createdAt = DEMO_MODE ? { seconds: Date.now()/1000 } : serverTimestamp();

    if (DEMO_MODE) {
      const id = "sh_" + Date.now();
      demoData.shoots.push({ id, ...data });
      showToast("Shoot request sent! We'll confirm within 24 hours.", "success");
      // Notify admin
      demoData.feedback.unshift({ id:"auto_"+Date.now(), clientId:"admin001", subject:"New shoot booking request", body:`${data.clientName} has requested a ${data.shootType} on ${data.shootDate}.`, isRead:false, createdAt:{ seconds:Date.now()/1000 } });
      form.reset();
      loadClientShoots(currentUser.uid);
      loadClientDashboard(currentUser.uid);
    } else {
      try {
        await addDoc(collection(db, "shoots"), data);
        showToast("Shoot requested! We'll confirm within 24 hours.", "success");
        form.reset();
        loadClientShoots(currentUser.uid);
      } catch(err) { showToast("Failed to request shoot: " + err.message, "error"); }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN ACTIONS
// ═══════════════════════════════════════════════════════════════════
function setupAdminActions() {
  document.getElementById("btn-invite-client")?.addEventListener("click", openInviteModal);
  document.getElementById("btn-send-feedback")?.addEventListener("click", () => openFeedbackModal(null, null, null));
  document.getElementById("btn-add-deliverable")?.addEventListener("click", () => openAddDeliverableModal(null, null, null));
  document.getElementById("btn-create-invoice")?.addEventListener("click", openCreateInvoiceModal);
  document.getElementById("btn-create-shoot")?.addEventListener("click", openCreateShootModal);

  // Brief filter tabs
  document.querySelectorAll("#view-admin-briefs .filter-tab").forEach(tab => {
    tab.addEventListener("click", async () => {
      document.querySelectorAll("#view-admin-briefs .filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const all = await getData("briefs");
      const f = tab.dataset.filter;
      renderBriefs(f === "all" ? all : all.filter(b => b.status === f));
    });
  });

  // Client search
  document.getElementById("client-search")?.addEventListener("input", async (e) => {
    const q = e.target.value.toLowerCase();
    const all = await getData("clients");
    const filtered = all.filter(c =>
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.contactName?.toLowerCase().includes(q)
    );
    const el = document.getElementById("admin-clients-list");
    el.innerHTML = filtered.length ? filtered.map(c => `
      <div class="card" onclick="openClientModal('${c.uid}')">
        <div class="card-header"><div>
          <div class="card-title">${c.company}</div>
          <div class="card-sub">${c.contactName}</div>
        </div><span class="badge badge-green">${c.status||"active"}</span></div>
        <div class="card-body">${c.email}</div>
      </div>`).join("") : `<div class="empty-state">No clients match "${e.target.value}"</div>`;
  });

  // Shoots filter
  document.querySelectorAll("#view-admin-shoots .filter-tab").forEach(tab => {
    tab.addEventListener("click", async () => {
      document.querySelectorAll("#view-admin-shoots .filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const all = await getData("shoots");
      const f = tab.dataset.filter;
      let filtered = all;
      if (f==="upcoming") filtered = all.filter(s => s.status !== "completed");
      if (f==="completed") filtered = all.filter(s => s.status === "completed");
      renderShootsList(filtered);
    });
  });
}

function renderShootsList(shoots) {
  const el = document.getElementById("admin-shoots-list");
  el.innerHTML = shoots.length ? shoots.map(s => `
    <div class="card">
      <div class="card-header">
        <div><div class="card-title">${s.clientName}</div><div class="card-sub">${s.shootType}</div></div>
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
      <div class="card-body">
        <div>📅 ${formatDate(s.shootDate)} at ${formatTime(s.shootTime)}</div>
        <div>📍 ${s.location}</div>
      </div>
      <div class="card-footer">
        ${s.status==="requested"?`<button class="btn-primary btn-sm" onclick="confirmShoot('${s.id}')">Confirm</button>`:""}
        ${s.status==="confirmed"?`<button class="btn-primary btn-sm" onclick="completeShoot('${s.id}')">Mark Complete</button>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No shoots found.</div>`;
}

// ─── MODALS ───────────────────────────────────────────────────────
function openInviteModal() {
  openModal("Invite New Client", `
    <div class="form-group"><label>Email Address</label><input type="email" id="invite-email" placeholder="client@dealership.com"/></div>
    <div class="form-group"><label>Company Name</label><input type="text" id="invite-company" placeholder="ABC Motors Ltd"/></div>
    <div class="form-group"><label>Contact Person</label><input type="text" id="invite-name"/></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="invite-phone" placeholder="+254 7XX XXX XXX"/></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="submitInvite()">Send Invite</button>
    </div>
    <p style="color:var(--text-dim);font-size:0.78rem;margin-top:0.75rem">In demo mode, this creates the client profile. With Firebase, an invitation email is sent.</p>
  `);
}

window.submitInvite = async function() {
  const email = document.getElementById("invite-email")?.value?.trim();
  const company = document.getElementById("invite-company")?.value?.trim();
  const name = document.getElementById("invite-name")?.value?.trim();
  const phone = document.getElementById("invite-phone")?.value?.trim();
  if (!email||!company) { showToast("Email and company name required.", "error"); return; }

  const client = { uid: "c_"+Date.now(), email, company, contactName: name||email, phone, status:"active", joinedAt:{ seconds:Date.now()/1000 } };

  if (DEMO_MODE) {
    demoData.clients.push(client);
    demoData.users[email] = { ...client, role:"client" };
    closeModal();
    showToast(`Client "${company}" added successfully.`, "success");
    loadAdminClients();
    loadAdminDashboard();
  } else {
    try {
      await setDoc(doc(db, "invites", email), { email, company, contactName: name, phone, invitedAt: serverTimestamp(), invitedBy: currentUser.uid });
      closeModal();
      showToast("Invite sent to " + email, "success");
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

window.openFeedbackModal = function(briefId, clientId, clientName) {
  openModal("Send Feedback to Client", `
    <div class="form-group"><label>Client</label>
      <select id="fb-client-select">
        ${demoData.clients.map(c=>`<option value="${c.uid}" ${c.uid===clientId?"selected":""}>${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Subject</label><input type="text" id="fb-subject" placeholder="e.g. Post-Shoot Creative Recommendations"/></div>
    <div class="form-group"><label>Tags</label>
      <div class="check-group">
        <label class="check-item"><input type="checkbox" name="fb-tags" value="creative"/><span>Creative</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="strategy"/><span>Strategy</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="scheduling"/><span>Scheduling</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="quality"/><span>Quality</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="branding"/><span>Branding</span></label>
      </div>
    </div>
    <div class="form-group"><label>Message</label><textarea id="fb-body" rows="6" placeholder="Write your feedback, recommendations, or notes here..."></textarea></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="submitFeedback()">Send Feedback</button>
    </div>
  `);
};

window.submitFeedback = async function() {
  const clientId = document.getElementById("fb-client-select")?.value;
  const subject = document.getElementById("fb-subject")?.value?.trim();
  const body = document.getElementById("fb-body")?.value?.trim();
  const tags = [...document.querySelectorAll("[name='fb-tags']:checked")].map(el=>el.value);
  if (!clientId||!subject||!body) { showToast("Please fill in all fields.", "error"); return; }

  const client = demoData.clients.find(c=>c.uid===clientId) || { company:"Client" };
  const fb = { id:"fb_"+Date.now(), clientId, clientName: client.company, from:"Epic Cinematic Films", subject, body, tags, isRead:false, createdAt:{ seconds:Date.now()/1000 } };

  if (DEMO_MODE) {
    demoData.feedback.unshift(fb);
    closeModal();
    showToast("Feedback sent to " + client.company, "success");
    loadAdminFeedback();
  } else {
    try {
      await addDoc(collection(db, "feedback"), { ...fb, createdAt: serverTimestamp() });
      closeModal();
      showToast("Feedback sent!", "success");
      loadAdminFeedback();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

window.openAddDeliverableModal = function(shootId, clientId, clientName) {
  openModal("Add Deliverable", `
    <div class="form-group"><label>Client</label>
      <select id="del-client-select">
        ${demoData.clients.map(c=>`<option value="${c.uid}" ${c.uid===clientId?"selected":""}>${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Title</label><input type="text" id="del-title" placeholder="e.g. Toyota Prado — Premium Package"/></div>
    <div class="form-group"><label>Type</label>
      <select id="del-type">
        <option value="photos">Photos</option>
        <option value="video">Video</option>
        <option value="reel">Reel</option>
      </select>
    </div>
    <div class="form-group"><label>Google Drive Link</label><input type="url" id="del-link" placeholder="https://drive.google.com/..."/></div>
    <div class="form-group"><label>Date Delivered</label><input type="date" id="del-date"/></div>
    <div class="form-group"><label>Notes</label><textarea id="del-notes" rows="2"></textarea></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="submitDeliverable()">Add Deliverable</button>
    </div>
  `);
  document.getElementById("del-date").value = new Date().toISOString().split("T")[0];
};

window.submitDeliverable = async function() {
  const clientId = document.getElementById("del-client-select")?.value;
  const title = document.getElementById("del-title")?.value?.trim();
  const type = document.getElementById("del-type")?.value;
  const driveLink = document.getElementById("del-link")?.value?.trim();
  const date = document.getElementById("del-date")?.value;
  if (!clientId||!title) { showToast("Client and title required.", "error"); return; }

  const client = demoData.clients.find(c=>c.uid===clientId)||{company:"Client"};
  const icons = { photos:"🖼️", video:"🎬", reel:"📱" };
  const item = { id:"del_"+Date.now(), clientId, clientName:client.company, title, type, driveLink, date, thumbnail:icons[type]||"📁", createdAt:{ seconds:Date.now()/1000 } };

  if (DEMO_MODE) {
    demoData.deliverables.push(item);
    closeModal();
    showToast("Deliverable added for " + client.company, "success");
    loadAdminDeliverables();
  } else {
    try {
      await addDoc(collection(db, "deliverables"), { ...item, createdAt: serverTimestamp() });
      closeModal();
      showToast("Deliverable added!", "success");
      loadAdminDeliverables();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

function openCreateInvoiceModal() {
  openModal("Create Invoice", `
    <div class="form-group"><label>Client</label>
      <select id="inv-client-select">
        ${demoData.clients.map(c=>`<option value="${c.uid}">${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Invoice Number</label><input type="text" id="inv-number" value="ECF-${new Date().getFullYear()}-${String(demoData.invoices.length+1).padStart(3,"0")}"/></div>
    <div class="form-group"><label>Amount (KES)</label><input type="number" id="inv-amount" min="0"/></div>
    <div class="form-group"><label>Description</label><input type="text" id="inv-desc" placeholder="e.g. Premium Combo Package — March 2026"/></div>
    <div class="form-group"><label>Due Date</label><input type="date" id="inv-due"/></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="submitInvoice()">Create Invoice</button>
    </div>
  `);
  const due = new Date(); due.setDate(due.getDate()+7);
  document.getElementById("inv-due").value = due.toISOString().split("T")[0];
}

window.submitInvoice = async function() {
  const clientId = document.getElementById("inv-client-select")?.value;
  const number = document.getElementById("inv-number")?.value?.trim();
  const amount = parseFloat(document.getElementById("inv-amount")?.value)||0;
  const description = document.getElementById("inv-desc")?.value?.trim();
  const dueDate = document.getElementById("inv-due")?.value;
  if (!clientId||!number||!amount) { showToast("Please fill in all required fields.", "error"); return; }

  const client = demoData.clients.find(c=>c.uid===clientId)||{company:"Client"};
  const inv = { id:"inv_"+Date.now(), clientId, clientName:client.company, number, amount, description, dueDate, status:"unpaid", createdAt:{ seconds:Date.now()/1000 } };

  if (DEMO_MODE) {
    demoData.invoices.push(inv);
    closeModal();
    showToast("Invoice created for " + client.company, "success");
    loadAdminInvoices();
    loadAdminDashboard();
  } else {
    try {
      await addDoc(collection(db, "invoices"), { ...inv, createdAt: serverTimestamp() });
      closeModal(); showToast("Invoice created!", "success");
      loadAdminInvoices();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

function openCreateShootModal() {
  openModal("Create Shoot (Admin)", `
    <div class="form-group"><label>Client</label>
      <select id="cs-client">
        ${demoData.clients.map(c=>`<option value="${c.uid}|${c.company}">${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Shoot Type</label>
      <select id="cs-type">
        <option>Standard Package — 15 images (KES 5,000)</option>
        <option>Premium Combo — 20 photos + 60-sec reel (KES 14,000)</option>
        <option>Full Feature (KES 22,000)</option>
        <option>Full Lot Shoot (KES 35,000)</option>
      </select>
    </div>
    <div class="form-group"><label>Date</label><input type="date" id="cs-date"/></div>
    <div class="form-group"><label>Time</label>
      <select id="cs-time">
        <option value="07:00">7:00 AM</option>
        <option value="09:00">9:00 AM</option>
        <option value="17:00">5:00 PM</option>
      </select>
    </div>
    <div class="form-group"><label>Location</label><input type="text" id="cs-location"/></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="submitAdminShoot()">Create Shoot</button>
    </div>
  `);
  document.getElementById("cs-date").value = new Date().toISOString().split("T")[0];
}

window.submitAdminShoot = async function() {
  const cv = document.getElementById("cs-client")?.value?.split("|");
  const clientId = cv?.[0], clientName = cv?.[1];
  const shootType = document.getElementById("cs-type")?.value;
  const shootDate = document.getElementById("cs-date")?.value;
  const shootTime = document.getElementById("cs-time")?.value;
  const location = document.getElementById("cs-location")?.value?.trim();
  if (!clientId||!shootDate||!location) { showToast("Please fill in all fields.", "error"); return; }

  const shoot = { id:"sh_"+Date.now(), clientId, clientName, shootType, shootDate, shootTime, location, status:"confirmed", numVehicles:1, createdAt:{ seconds:Date.now()/1000 } };
  if (DEMO_MODE) {
    demoData.shoots.push(shoot);
    closeModal(); showToast("Shoot created for " + clientName, "success");
    loadAdminShoots(); loadAdminDashboard();
  } else {
    try {
      await addDoc(collection(db, "shoots"), { ...shoot, createdAt: serverTimestamp() });
      closeModal(); showToast("Shoot created!", "success");
      loadAdminShoots();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

window.approveBrief = async function(id) {
  if (DEMO_MODE) {
    const b = demoData.briefs.find(x=>x.id===id);
    if (b) { b.status = "approved"; showToast("Brief approved!", "success"); loadAdminBriefs(); loadAdminDashboard(); }
  } else {
    try { await updateDoc(doc(db,"briefs",id),{status:"approved"}); showToast("Brief approved!","success"); loadAdminBriefs(); } catch(e) { showToast("Error: "+e.message,"error"); }
  }
};

window.confirmShoot = async function(id) {
  if (DEMO_MODE) {
    const s = demoData.shoots.find(x=>x.id===id);
    if (s) { s.status = "confirmed"; showToast("Shoot confirmed!","success"); loadAdminShoots(); loadAdminDashboard(); }
  } else {
    try { await updateDoc(doc(db,"shoots",id),{status:"confirmed"}); showToast("Shoot confirmed!","success"); loadAdminShoots(); } catch(e) { showToast("Error: "+e.message,"error"); }
  }
};

window.completeShoot = async function(id) {
  if (DEMO_MODE) {
    const s = demoData.shoots.find(x=>x.id===id);
    if (s) { s.status = "completed"; showToast("Shoot marked complete!","success"); loadAdminShoots(); loadAdminDashboard(); }
  } else {
    try { await updateDoc(doc(db,"shoots",id),{status:"completed"}); showToast("Marked complete!","success"); loadAdminShoots(); } catch(e) { showToast("Error: "+e.message,"error"); }
  }
};

window.markInvoicePaid = async function(id) {
  if (DEMO_MODE) {
    const i = demoData.invoices.find(x=>x.id===id);
    if (i) { i.status = "paid"; showToast("Invoice marked as paid!","success"); loadAdminInvoices(); loadAdminDashboard(); }
  } else {
    try { await updateDoc(doc(db,"invoices",id),{status:"paid"}); showToast("Invoice marked paid!","success"); loadAdminInvoices(); } catch(e) { showToast("Error: "+e.message,"error"); }
  }
};

window.openClientModal = function(uid) {
  const c = demoData.clients.find(x=>x.uid===uid);
  if (!c) return;
  openModal(c.company, `
    <div style="display:flex;flex-direction:column;gap:0.75rem">
      <div style="display:flex;gap:1rem;align-items:center;margin-bottom:0.5rem">
        <div class="user-avatar admin-avatar" style="width:48px;height:48px;font-size:1.1rem">${getInitials(c.company)}</div>
        <div>
          <div style="font-weight:600">${c.contactName}</div>
          <div style="color:var(--text-dim);font-size:0.85rem">${c.email}</div>
          <div style="color:var(--text-dim);font-size:0.85rem">${c.phone||""}</div>
        </div>
      </div>
      <div style="background:var(--dark4);border-radius:6px;padding:0.75rem;font-size:0.85rem">
        <div><strong>Status:</strong> <span class="badge badge-green">${c.status||"active"}</span></div>
        <div style="margin-top:0.4rem"><strong>Joined:</strong> ${c.joinedAt ? formatDate(new Date(c.joinedAt.seconds*1000).toISOString().split("T")[0]) : "N/A"}</div>
      </div>
    </div>
    <div class="brief-actions" style="margin-top:1rem">
      <button class="btn-primary btn-sm" onclick="openFeedbackModal(null,'${c.uid}','${c.company}');closeModal()">Send Feedback</button>
      <button class="btn-ghost btn-sm" onclick="openCreateInvoiceModal();closeModal()">Create Invoice</button>
    </div>
  `);
};

window.openBriefModal = function(id) {
  const b = demoData.briefs.find(x=>x.id===id);
  if (!b) return;
  openModal("Brand Brief — " + (b.dealershipName||b.clientName), `
    <div style="display:flex;flex-direction:column;gap:0.6rem;font-size:0.875rem">
      ${b.dealershipName?`<div><strong>Dealership:</strong> ${b.dealershipName}</div>`:""}
      ${b.location?`<div><strong>Location:</strong> ${b.location}</div>`:""}
      ${b.tagline?`<div><strong>Tagline:</strong> "${b.tagline}"</div>`:""}
      ${b.brandValues?`<div><strong>Brand Values:</strong> ${b.brandValues}</div>`:""}
      ${b.primaryColor?`<div><strong>Primary Colour:</strong> <span style="display:inline-block;width:14px;height:14px;background:${b.primaryColor};border-radius:2px;vertical-align:middle;margin-right:0.3rem"></span>${b.primaryColor}</div>`:""}
      ${b.instagram?`<div><strong>Instagram:</strong> ${b.instagram}</div>`:""}
      ${b.idealCustomer?`<div><strong>Ideal Customer:</strong> ${b.idealCustomer}</div>`:""}
      ${b.dontWant?`<div><strong>Do NOT do:</strong> ${b.dontWant}</div>`:""}
      <div style="margin-top:0.5rem">
        <div style="height:4px;background:var(--dark4);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${b.completionPct||0}%;background:var(--gold)"></div>
        </div>
        <span style="font-size:0.75rem;color:var(--text-dim)">Completion: ${b.completionPct||0}%</span>
      </div>
    </div>
    <div class="brief-actions">
      <button class="btn-primary btn-sm" onclick="approveBrief('${b.id}')">Approve Brief</button>
      <button class="btn-ghost btn-sm" onclick="openFeedbackModal('${b.id}','${b.clientId}','${b.dealershipName||b.clientName}')">Send Feedback</button>
    </div>
  `);
};

// ─── CLIENT ACTIONS ───────────────────────────────────────────────
function setupClientActions(uid) {
  document.getElementById("client-signout")?.addEventListener("click", handleSignOut);
  document.getElementById("profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const company = document.getElementById("profile-company")?.value?.trim();
    const contactName = document.getElementById("profile-contact")?.value?.trim();
    const phone = document.getElementById("profile-phone")?.value?.trim();
    if (DEMO_MODE) {
      const u = Object.values(demoData.users).find(x=>x.uid===uid);
      if (u) { u.company = company; u.contactName = contactName; u.phone = phone; }
      document.getElementById("client-brand-name").textContent = company.toUpperCase();
      document.getElementById("client-welcome-name").textContent = "Welcome back, " + contactName.split(" ")[0];
      showToast("Profile updated.", "success");
    } else {
      try { await updateDoc(doc(db,"users",uid),{ company, contactName, phone }); showToast("Profile updated!","success"); } catch(e) { showToast("Error: "+e.message,"error"); }
    }
  });

  // Welcome CTA
  document.querySelector(".welcome-cta .btn-primary")?.addEventListener("click", () => navigateTo("client-shoots"));

  document.querySelectorAll(".dash-panel .panel-link, .empty-state a[data-view]").forEach(link => {
    link.addEventListener("click", e => { e.preventDefault(); navigateTo(link.dataset.view); });
  });
}

window.markFeedbackRead = async function(id, uid, cardEl) {
  if (DEMO_MODE) {
    const f = demoData.feedback.find(x=>x.id===id);
    if (f) { f.isRead = true; cardEl.classList.remove("unread"); }
  } else {
    try { await updateDoc(doc(db,"feedback",id),{isRead:true}); cardEl.classList.remove("unread"); } catch(e) {}
  }
};

// ═══════════════════════════════════════════════════════════════════
//  SIGN OUT
// ═══════════════════════════════════════════════════════════════════
async function handleSignOut() {
  if (DEMO_MODE) {
    demoSession = null;
    localStorage.removeItem("ecf_demo_session");
    currentUser = null; isAdmin = false; currentPortal = null;
    document.getElementById("login-email").value = "";
    document.getElementById("login-password").value = "";
    showScreen("auth-screen");
  } else {
    await signOut(auth);
  }
}
document.getElementById("admin-signout")?.addEventListener("click", handleSignOut);

// ═══════════════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════════════
function setupNavigation() {
  document.querySelectorAll(".nav-item[data-view]").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      navigateTo(item.dataset.view);
    });
  });
  document.querySelectorAll("[data-view]").forEach(el => {
    if (!el.classList.contains("nav-item") && !el.classList.contains("filter-tab")) {
      el.addEventListener("click", e => { e.preventDefault(); navigateTo(el.dataset.view); });
    }
  });
}

function navigateTo(viewId) {
  const portal = currentPortal;
  const prefix = portal === "admin" ? "admin" : "client";
  const titleMap = {
    "admin-dashboard":"Dashboard","admin-clients":"Clients","admin-briefs":"Brand Briefs",
    "admin-shoots":"Shoots","admin-feedback":"Feedback","admin-gallery":"Deliverables","admin-invoices":"Invoices",
    "client-dashboard":"Dashboard","client-brief":"Brand Brief","client-shoots":"Schedule Shoot",
    "client-deliverables":"Deliverables","client-feedback":"Feedback","client-invoices":"Invoices","client-profile":"My Profile"
  };

  // Hide all views
  document.querySelectorAll(`#${prefix}-screen .view`).forEach(v => v.classList.remove("active"));
  document.querySelectorAll(`#${prefix}-sidebar .nav-item`).forEach(n => n.classList.remove("active"));

  // Show target
  const targetView = document.getElementById("view-" + viewId);
  if (targetView) targetView.classList.add("active");

  // Highlight nav
  const targetNav = document.querySelector(`#${prefix}-sidebar [data-view="${viewId}"]`);
  if (targetNav) targetNav.classList.add("active");

  // Update title
  const titleEl = document.getElementById(`${prefix}-view-title`);
  if (titleEl) titleEl.textContent = titleMap[viewId] || viewId;

  // Close mobile sidebar
  closeSidebar(prefix);
}

// ─── SIDEBAR MOBILE ───────────────────────────────────────────────
function setupSidebar() {
  // Backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "sidebar-backdrop";
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", () => { closeSidebar("admin"); closeSidebar("client"); });

  document.getElementById("admin-hamburger")?.addEventListener("click", () => toggleSidebar("admin"));
  document.getElementById("client-hamburger")?.addEventListener("click", () => toggleSidebar("client"));
}
function toggleSidebar(prefix) {
  const sidebar = document.getElementById(`${prefix}-sidebar`);
  const isOpen = sidebar?.classList.contains("open");
  sidebar?.classList.toggle("open", !isOpen);
  document.getElementById("sidebar-backdrop")?.classList.toggle("active", !isOpen);
}
function closeSidebar(prefix) {
  document.getElementById(`${prefix}-sidebar`)?.classList.remove("open");
  document.getElementById("sidebar-backdrop")?.classList.remove("active");
}

// ═══════════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════
function openModal(title, bodyHTML) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHTML;
  document.getElementById("modal-overlay").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal-overlay").classList.add("hidden"); }
window.closeModal = closeModal;
document.getElementById("modal-close-btn")?.addEventListener("click", closeModal);
document.getElementById("modal-overlay")?.addEventListener("click", e => { if(e.target===e.currentTarget) closeModal(); });

// ═══════════════════════════════════════════════════════════════════
//  FIREBASE HELPERS
// ═══════════════════════════════════════════════════════════════════
async function getUserDoc(uid) {
  if (DEMO_MODE) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch(e) { return null; }
}

async function getData(collectionName, clientId = null) {
  if (DEMO_MODE) {
    if (!clientId) return demoData[collectionName] || [];
    const adminCollections = ["users"]; // Admin sees all
    const data = demoData[collectionName] || [];
    if (collectionName === "clients") return data;
    return data.filter(item => item.clientId === clientId);
  }
  try {
    let q;
    if (clientId) {
      q = query(collection(db, collectionName), where("clientId","==",clientId), orderBy("createdAt","desc"));
    } else {
      q = query(collection(db, collectionName), orderBy("createdAt","desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch(e) {
    console.warn("getData error:", collectionName, e.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
function collectFormData(form) {
  const data = {};
  const fd = new FormData(form);

  // Text fields
  form.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=color]), select, textarea").forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  // Checkboxes (multi-select → array)
  const checkNames = new Set([...form.querySelectorAll("input[type=checkbox]")].map(el=>el.name));
  checkNames.forEach(name => {
    data[name] = [...form.querySelectorAll(`input[type=checkbox][name="${name}"]:checked`)].map(el=>el.value);
  });

  // Radios
  form.querySelectorAll("input[type=radio]:checked").forEach(el => { data[el.name] = el.value; });

  return data;
}

function populateForm(form, data) {
  Object.entries(data).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      val.forEach(v => {
        const el = form.querySelector(`input[name="${key}"][value="${v}"]`);
        if (el) el.checked = true;
      });
    } else {
      const el = form.querySelector(`[name="${key}"]`);
      if (el && el.type !== "checkbox" && el.type !== "radio") el.value = val;
      else if (el && el.type === "radio" && el.value === val) el.checked = true;
    }
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 5000);
}

function showToast(message, type="info") {
  const container = document.getElementById("toast-container");
  const icons = { success:"✓", error:"✕", info:"◆" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||"◆"}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-fade");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function setButtonLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? "Please wait..." : btn.dataset.originalText || btn.textContent;
  if (!loading && !btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
}

function statusBadge(status) {
  const map = { requested:"badge-gold", confirmed:"badge-blue", completed:"badge-green", cancelled:"badge-red", pending:"badge-gold", approved:"badge-green", rejected:"badge-red", paid:"badge-green", unpaid:"badge-gold", overdue:"badge-red" };
  return map[status] || "badge-grey";
}

function getInitials(name="") {
  return name.split(" ").map(w=>w[0]||"").join("").toUpperCase().substring(0,2) || "?";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-KE", { day:"numeric", month:"short", year:"numeric" });
  } catch { return dateStr; }
}

function formatTime(time) {
  if (!time) return "";
  const [h,m] = time.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour-12 : hour||12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatRelativeDate(seconds) {
  const diff = Date.now()/1000 - seconds;
  if (diff < 3600) return Math.round(diff/60) + " min ago";
  if (diff < 86400) return Math.round(diff/3600) + " hrs ago";
  if (diff < 604800) return Math.round(diff/86400) + " days ago";
  return new Date(seconds*1000).toLocaleDateString("en-KE",{day:"numeric",month:"short"});
}
