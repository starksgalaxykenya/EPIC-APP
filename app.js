// ═══════════════════════════════════════════════════════════════════
//  EPIC CINEMATIC FILMS — EPIC APP v2.0
//  Complete Portal with Admin Pricing, Calendar, Guest Mode
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

// ═══════════════════════════════════════════════════════════════════
//  ADD THIS RIGHT AFTER YOUR IMPORTS AND BEFORE ANY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// Add CSS for brief cards
const style = document.createElement('style');
style.textContent = `
  .brief-card {
    transition: all 0.3s ease;
    cursor: pointer;
  }
  .brief-card:hover {
    border-color: var(--border-gold);
    transform: translateY(-2px);
  }
  .brief-details {
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .details-section {
    background: var(--dark4);
    border-radius: var(--radius-sm);
    padding: 1rem;
    margin-bottom: 0.5rem;
  }
  .details-section-title {
    font-size: 0.8rem;
    color: var(--gold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.25rem;
  }
  .details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  .details-item {
    font-size: 0.85rem;
  }
  .details-item.full-span {
    grid-column: 1 / -1;
  }
  .details-label {
    color: var(--text-dim);
    font-size: 0.7rem;
    text-transform: uppercase;
    display: block;
    margin-bottom: 0.2rem;
  }
  .details-value {
    color: var(--text);
  }
  .details-value a {
    color: var(--gold);
    text-decoration: none;
  }
  .details-value a:hover {
    text-decoration: underline;
  }
  .toggle-icon {
    transition: transform 0.3s ease;
  }
`;
document.head.appendChild(style);

// ─── FIREBASE CONFIG ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBBIl05mFeX9xPtztnU8NPtyBrLq2-IvhI",
  authDomain: "epic-cinematic-app.firebaseapp.com",
  projectId: "epic-cinematic-app",
  storageBucket: "epic-cinematic-app.firebasestorage.app",
  messagingSenderId: "419442946441",
  appId: "1:419442946441:web:693d58a6bcc28b39a0b158",
  measurementId: "G-YF1TEDXR7L"
};

// ─── ADMIN EMAIL ─────────────────────────────────────
const ADMIN_EMAIL = "admin@epic.com";

// ─── INIT FIREBASE ────────────────────────────────────────────────
let app, auth, db;
let currentUser = null;
let isAdmin = false;
let currentPortal = null; // 'admin', 'client', 'guest'

// Demo mode flag
let DEMO_MODE = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  if (firebaseConfig.apiKey.includes("DEMO") || firebaseConfig.apiKey.includes("REPLACE")) {
    DEMO_MODE = true;
    console.warn("⚠️ Demo mode: Using local storage simulation.");
  }
} catch(e) {
  DEMO_MODE = true;
  console.warn("Firebase init failed — running in demo mode:", e.message);
}

// ═══════════════════════════════════════════════════════════════════
//  DEMO MODE — LocalStorage simulation
// ═══════════════════════════════════════════════════════════════════
const demoData = {
  users: {
    "admin@epiccinematicfilms.com": { uid: "admin001", email: "admin@epiccinematicfilms.com", company: "Epic Cinematic Films", contactName: "Admin", role: "admin", phone: "+254 715 150 894" },
    "demo@company.com": { uid: "client001", email: "demo@company.com", company: "Demo Company", contactName: "John Doe", role: "client", phone: "+254 722 000 001" }
  },
  products: [
    { id: "prod1", category: "Automotive", name: "Basic Listing Package", description: "10 high-quality images", basePrice: 3500, type: "photos", addon: false },
    { id: "prod2", category: "Automotive", name: "Standard Package", description: "15 images", basePrice: 5000, type: "photos", addon: false },
    { id: "prod3", category: "Automotive", name: "Premium Detail Package", description: "20 images", basePrice: 7500, type: "photos", addon: false },
    { id: "prod4", category: "Automotive", name: "Full Lot Shoot", description: "Up to 10 vehicles", basePrice: 35000, type: "photos", addon: false },
    { id: "prod5", category: "Video", name: "30-Second Reel", description: "Social media reel", basePrice: 6000, type: "video", addon: false },
    { id: "prod6", category: "Video", name: "60-Second Reel", description: "Extended reel", basePrice: 9000, type: "video", addon: false },
    { id: "prod7", category: "Video", name: "90-Second Feature", description: "Feature reel", basePrice: 13000, type: "video", addon: false },
    { id: "prod8", category: "Video", name: "Walkthrough Video", description: "Full walkthrough", basePrice: 15000, type: "video", addon: false },
    { id: "prod9", category: "Combo", name: "Standard Combo", description: "15 photos + 30-sec reel", basePrice: 9500, type: "combo", addon: false },
    { id: "prod10", category: "Combo", name: "Premium Combo", description: "20 photos + 60-sec reel", basePrice: 14000, type: "combo", addon: false },
    { id: "prod11", category: "Combo", name: "Full Feature", description: "Complete package", basePrice: 22000, type: "combo", addon: false },
    { id: "prod12", category: "Events", name: "Event Coverage (2 hours)", description: "Event photography/video", basePrice: 25000, type: "event", addon: false },
    { id: "prod13", category: "Events", name: "Event Coverage (Full day)", description: "Full day coverage", basePrice: 50000, type: "event", addon: false },
    { id: "prod14", category: "Commercial", name: "Corporate Photography", description: "Corporate headshots/events", basePrice: 20000, type: "commercial", addon: false },
    { id: "prod15", category: "Commercial", name: "Brand Commercial", description: "60-sec brand commercial", basePrice: 45000, type: "video", addon: false },
    { id: "addon1", category: "Add-ons", name: "Drone Footage", description: "Aerial footage", basePrice: 8000, type: "addon", addon: true },
    { id: "addon2", category: "Add-ons", name: "Lifestyle Location Shoot", description: "On-location lifestyle", basePrice: 12000, type: "addon", addon: true },
    { id: "addon3", category: "Add-ons", name: "Caption Copywriting", description: "Per post", basePrice: 500, type: "addon", addon: true }
  ],
  shoots: [
    { id: "sh001", clientId: "client001", clientName: "Demo Company", serviceType: "Premium Combo", shootDate: "2026-03-20", shootTime: "07:00", location: "Nairobi", status: "confirmed", details: "Commercial shoot", createdAt: { seconds: Date.now()/1000 } }
  ],
  briefs: [
    { id: "br001", clientId: "client001", clientName: "Demo Company", companyName: "Demo Company", location: "Nairobi", industry: "automotive", status: "approved", completionPct: 80, createdAt: { seconds: Date.now()/1000 } }
  ],
  feedback: [
    { id: "fb001", clientId: "client001", from: "Epic Cinematic Films", subject: "Creative Recommendations", body: "Great working with you!", tags: ["creative"], isRead: false, createdAt: { seconds: Date.now()/1000 - 86400 } }
  ],
  deliverables: [
    { id: "del001", clientId: "client001", title: "Commercial Shoot", type: "video", driveLink: "https://drive.google.com", thumbnail: "🎬", date: "2026-02-18", public: true }
  ],
  invoices: [
    { id: "inv001", clientId: "client001", clientName: "Demo Company", number: "ECF-2026-001", amount: 14000, status: "paid", dueDate: "2026-02-25", createdAt: { seconds: Date.now()/1000 - 2592000 } }
  ],
  clients: [
    { uid: "client001", company: "Demo Company", contactName: "John Doe", email: "demo@company.com", phone: "+254 722 000 001", status: "active", joinedAt: { seconds: Date.now()/1000 - 5184000 } }
  ]
};

let demoSession = JSON.parse(localStorage.getItem("ecf_demo_session") || "null");

// ═══════════════════════════════════════════════════════════════════
//  DOM READY
// ═══════════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
  setupSidebar();
  setupNavigation();
  setupBriefForm();
  setupBookingForm();
  setupEstimator(); // Now this function is defined below
  setupGuestFeatures();

  if (DEMO_MODE) {
    addDemoBanner();
    if (demoSession) resumeDemoSession(demoSession);
    else showScreen("auth-screen");
  } else {
    onAuthStateChanged(auth, handleAuthStateChange);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  SETUP FUNCTIONS (defined before they're called)
// ═══════════════════════════════════════════════════════════════════

function setupEstimator() {
  // This function will be implemented later
  console.log("Estimator setup complete");
}

function setupGuestFeatures() {
  // This function will be implemented later
  console.log("Guest features setup complete");
}

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
      loadClientPortal(userDoc || { email: user.email, company: "My Company", contactName: user.email });
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
  banner.innerHTML = "⚡ DEMO MODE — Epic App v2.0 | Admin: admin@epiccinematicfilms.com / admin123 | Client: demo@company.com / client123 | Guest mode available";
  document.body.appendChild(banner);
  document.querySelectorAll(".screen").forEach(s => s.style.paddingTop = "30px");
}

// ─── DEMO RESUME ─────────────────────────────────────────────────
function resumeDemoSession(session) {
  const user = demoData.users[session.email];
  if (!user) { 
    if (session.guest) {
      loadGuestPortal();
      return;
    }
    showScreen("auth-screen"); 
    return; 
  }
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

  // Guest mode
  document.getElementById("btn-guest").addEventListener("click", () => {
    demoSession = { guest: true };
    localStorage.setItem("ecf_demo_session", JSON.stringify(demoSession));
    loadGuestPortal();
  });
}

async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const pass  = document.getElementById("login-password").value;
  if (!email || !pass) { showError("login-error", "Please fill in all fields."); return; }

  setButtonLoading("btn-login", true);

  if (DEMO_MODE) {
    const user = demoData.users[email];
    const validPasswords = { "admin@epiccinematicfilms.com": "admin123", "demo@company.com": "client123" };
    if (!user || validPasswords[email] !== pass) {
      showError("login-error", "Invalid email or password.");
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
    const msgs = { "auth/user-not-found": "No account found with this email.", "auth/wrong-password": "Incorrect password." };
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
    const msgs = { "auth/email-already-in-use": "An account with this email already exists." };
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
  
  // Load all admin sections
  loadAdminDashboard();
  loadAdminClients();
  loadAdminBriefs();
  loadAdminShoots();
  loadAdminProducts();
  loadAdminFeedback();
  loadAdminDeliverables();
  loadAdminInvoices();
  setupAdminActions();
}

function loadClientPortal(userData) {
  currentPortal = "client";
  showScreen("client-screen");
  const company = userData.company || "My Company";
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
  
  // Load client data
  loadClientDashboard(uid);
  loadClientBrief(uid);
  loadClientBookings(uid);
  loadClientDeliverables(uid);
  loadClientFeedback(uid);
  loadClientInvoices(uid);
  loadClientEstimator();
  setupClientActions(uid);
  setupBookingCalendar(uid);
}

function loadGuestPortal() {
  currentPortal = "guest";
  showScreen("guest-screen");
  
  // Load guest features
  loadGuestEstimator();
  loadGuestServices();
  loadGuestPortfolio();
  setupGuestContact();
  
  document.getElementById("guest-signout").addEventListener("click", () => {
    demoSession = null;
    localStorage.removeItem("ecf_demo_session");
    showScreen("auth-screen");
  });
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN — DATA LOADERS
// ═══════════════════════════════════════════════════════════════════
async function loadAdminDashboard() {
  const [clients, shoots, briefs, invoices] = await Promise.all([
    getData("clients"), getData("shoots"), getData("briefs"), getData("invoices")
  ]);

  document.getElementById("stat-clients").textContent = clients.length;
  document.getElementById("stat-bookings").textContent = shoots.filter(s => s.status !== "completed").length;
  document.getElementById("stat-briefs").textContent = briefs.length;
  
  const monthRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0);
  document.getElementById("stat-revenue").textContent = "KES " + monthRevenue.toLocaleString();

  // Upcoming bookings
  const upcomingEl = document.getElementById("admin-upcoming-bookings");
  const upcoming = shoots.filter(s => s.status !== "completed").sort((a,b) => a.shootDate > b.shootDate ? 1 : -1).slice(0,4);
  upcomingEl.innerHTML = upcoming.length ? upcoming.map(s => `
    <div class="shoot-item">
      <div class="shoot-item-title">${s.clientName} — ${s.serviceType || s.shootType}</div>
      <div class="shoot-item-meta">
        <span>📅 ${formatDate(s.shootDate)}</span>
        <span>🕒 ${formatTime(s.shootTime)}</span>
        <span>📍 ${s.location}</span>
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No upcoming bookings.</div>`;

  // Recent briefs
  const briefsEl = document.getElementById("admin-recent-briefs");
  const recent = briefs.slice(-3).reverse();
  briefsEl.innerHTML = recent.length ? recent.map(b => `
    <div class="shoot-item">
      <div class="shoot-item-title">${b.companyName || b.clientName}</div>
      <div class="shoot-item-meta">
        <span>Industry: ${b.industry || "—"}</span>
        <span class="badge ${b.status==="approved"?"badge-green":"badge-gold"}">${b.status || "pending"}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No briefs yet.</div>`;

  // Pending actions
  const actionsEl = document.getElementById("admin-pending-actions");
  const actions = [];
  briefs.filter(b => b.status !== "approved").forEach(b => actions.push({ dot:"gold", text:`Review brand brief from ${b.companyName || b.clientName}` }));
  shoots.filter(s => s.status === "requested").forEach(s => actions.push({ dot:"blue", text:`Confirm booking for ${s.clientName} on ${formatDate(s.shootDate)}` }));
  invoices.filter(i => i.status === "unpaid").forEach(i => actions.push({ dot:"red", text:`Invoice ${i.number} from ${i.clientName} is unpaid` }));
  
  actionsEl.innerHTML = actions.length ? actions.map(a => `
    <div class="action-item">
      <div class="action-dot ${a.dot}"></div>
      <span>${a.text}</span>
    </div>`).join("") : `<div class="empty-state">All clear — no pending actions. ✓</div>`;

  document.getElementById("admin-notif-count").textContent = actions.length;
}

async function loadAdminClients() {
  const clients = await getData("clients");
  const el = document.getElementById("admin-clients-list");
  el.innerHTML = clients.length ? clients.map(c => `
    <div class="card" onclick="window.openClientModal('${c.uid}')">
      <div class="card-header">
        <div>
          <div class="card-title">${c.company}</div>
          <div class="card-sub">${c.contactName}</div>
        </div>
        <span class="badge ${c.status==="active"?"badge-green":"badge-grey"}">${c.status || "active"}</span>
      </div>
      <div class="card-body">${c.email}<br/>${c.phone || ""}</div>
    </div>`).join("") : `<div class="empty-state">No clients yet.</div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  UPDATE YOUR EXISTING loadAdminBriefs FUNCTION
// ═══════════════════════════════════════════════════════════════════

async function loadAdminBriefs() {
  const briefs = await getData("briefs");
  renderBriefs(briefs);
  addBriefToolbarButtons(); // ADD THIS LINE
}

// Update the renderBriefs function to include expandable cards
function renderBriefs(briefs) {
  const el = document.getElementById("admin-briefs-list");
  if (!el) return;
  
  el.innerHTML = briefs.length ? briefs.map(b => {
    // Format all the brief details for display
    const details = formatBriefDetails(b);
    
    return `
    <div class="card brief-card" data-brief-id="${b.id}" style="cursor:pointer">
      <div class="card-header" onclick="event.stopPropagation();window.toggleBriefDetails('${b.id}')">
        <div style="flex:1">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem">
            <span class="badge ${b.status==="approved"?"badge-green":b.status==="rejected"?"badge-red":"badge-gold"}">${b.status || "pending"}</span>
            <span class="badge badge-grey">${b.industry || "Not specified"}</span>
          </div>
          <div class="card-title">${b.companyName || b.clientName || "Unknown"}</div>
          <div class="card-sub">${b.location || ""} · ${b.tradingName ? `Trading as: ${b.tradingName}` : ""}</div>
        </div>
        <div style="display:flex; align-items:center; gap:0.5rem">
          <div style="text-align:right">
            <div style="font-size:0.75rem; color:var(--text-dim)">Completion</div>
            <div style="font-size:0.9rem; color:var(--gold)">${b.completionPct||0}%</div>
          </div>
          <svg class="toggle-icon" id="toggle-icon-${b.id}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="transform:rotate(0deg); transition:transform 0.3s">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      
      <!-- Progress bar -->
      <div style="margin:0.5rem 0; height:4px; background:var(--dark4); border-radius:2px; overflow:hidden">
        <div style="height:100%; width:${b.completionPct||0}%; background:var(--gold)"></div>
      </div>
      
      <!-- Collapsible details section -->
      <div id="brief-details-${b.id}" class="brief-details" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border)">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:1rem">
          ${details}
        </div>
        
        <!-- Action buttons -->
        <div class="brief-actions" style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid var(--border)">
          <button class="btn-primary btn-sm" onclick="event.stopPropagation();window.approveBrief('${b.id}')">
            ${b.status === "approved" ? "✓ Approved" : "Approve Brief"}
          </button>
          <button class="btn-ghost btn-sm" onclick="event.stopPropagation();window.openFeedbackModal('${b.id}','${b.clientId}','${b.companyName||b.clientName}')">
            Send Feedback
          </button>
          <button class="btn-ghost btn-sm" onclick="event.stopPropagation();window.printBrief('${b.id}')">
            📄 Export
          </button>
        </div>
      </div>
    </div>`}).join("") : `<div class="empty-state">No brand briefs submitted yet.</div>`;
  
  // Add click handler for the whole card to expand/collapse
  document.querySelectorAll('.brief-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't toggle if clicking on a button
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      const briefId = card.dataset.briefId;
      toggleBriefDetails(briefId);
    });
  });
}

// Function to toggle brief details
window.toggleBriefDetails = function(briefId) {
  const detailsEl = document.getElementById(`brief-details-${briefId}`);
  const iconEl = document.getElementById(`toggle-icon-${briefId}`);
  
  if (detailsEl && iconEl) {
    if (detailsEl.style.display === 'none') {
      detailsEl.style.display = 'block';
      iconEl.style.transform = 'rotate(180deg)';
    } else {
      detailsEl.style.display = 'none';
      iconEl.style.transform = 'rotate(0deg)';
    }
  }
};

// Function to format brief details into HTML
function formatBriefDetails(brief) {
  const sections = [];
  
  // Company Information
  sections.push(`
    <div class="details-section">
      <div class="details-section-title">🏢 Company Information</div>
      <div class="details-grid">
        ${brief.companyName ? `<div class="details-item"><span class="details-label">Company:</span> <span class="details-value">${brief.companyName}</span></div>` : ''}
        ${brief.tradingName ? `<div class="details-item"><span class="details-label">Trading as:</span> <span class="details-value">${brief.tradingName}</span></div>` : ''}
        ${brief.industry ? `<div class="details-item"><span class="details-label">Industry:</span> <span class="details-value">${brief.industry}</span></div>` : ''}
        ${brief.location ? `<div class="details-item"><span class="details-label">Location:</span> <span class="details-value">${brief.location}</span></div>` : ''}
        ${brief.phone ? `<div class="details-item"><span class="details-label">Phone:</span> <span class="details-value">${brief.phone}</span></div>` : ''}
        ${brief.website ? `<div class="details-item"><span class="details-label">Website:</span> <span class="details-value"><a href="${brief.website}" target="_blank">${brief.website}</a></span></div>` : ''}
      </div>
    </div>
  `);
  
  // Social Media
  const social = [];
  if (brief.instagram) social.push(`📷 Instagram: ${brief.instagram}`);
  if (brief.facebook) social.push(`📘 Facebook: ${brief.facebook}`);
  if (brief.tiktok) social.push(`🎵 TikTok: ${brief.tiktok}`);
  
  if (social.length > 0) {
    sections.push(`
      <div class="details-section">
        <div class="details-section-title">📱 Social Media</div>
        <div class="details-grid">
          ${social.map(s => `<div class="details-item"><span class="details-value">${s}</span></div>`).join('')}
        </div>
      </div>
    `);
  }
  
  // Brand Identity
  if (brief.primaryColor || brief.secondaryColor || brief.tagline || brief.brandValues || brief.logoLink) {
    sections.push(`
      <div class="details-section">
        <div class="details-section-title">🎨 Brand Identity</div>
        <div class="details-grid">
          ${brief.primaryColor ? `
            <div class="details-item">
              <span class="details-label">Primary Color:</span>
              <span class="details-value" style="display:flex; align-items:center; gap:0.3rem">
                <span style="display:inline-block; width:16px; height:16px; background:${brief.primaryColor}; border-radius:3px;"></span>
                ${brief.primaryColor}
              </span>
            </div>` : ''}
          ${brief.secondaryColor ? `
            <div class="details-item">
              <span class="details-label">Secondary Color:</span>
              <span class="details-value" style="display:flex; align-items:center; gap:0.3rem">
                <span style="display:inline-block; width:16px; height:16px; background:${brief.secondaryColor}; border-radius:3px;"></span>
                ${brief.secondaryColor}
              </span>
            </div>` : ''}
          ${brief.tagline ? `<div class="details-item"><span class="details-label">Tagline:</span> <span class="details-value">"${brief.tagline}"</span></div>` : ''}
          ${brief.brandValues ? `<div class="details-item"><span class="details-label">Brand Values:</span> <span class="details-value">${brief.brandValues}</span></div>` : ''}
          ${brief.fonts ? `<div class="details-item"><span class="details-label">Fonts:</span> <span class="details-value">${brief.fonts}</span></div>` : ''}
          ${brief.logoLink ? `<div class="details-item"><span class="details-label">Logo Files:</span> <span class="details-value"><a href="${brief.logoLink}" target="_blank">View Drive →</a></span></div>` : ''}
        </div>
      </div>
    `);
  }
  
  // Target Audience
  if (brief.audienceAge || brief.audienceType || brief.idealCustomer) {
    sections.push(`
      <div class="details-section">
        <div class="details-section-title">👥 Target Audience</div>
        <div class="details-grid">
          ${brief.audienceAge ? `<div class="details-item"><span class="details-label">Age Groups:</span> <span class="details-value">${Array.isArray(brief.audienceAge) ? brief.audienceAge.join(', ') : brief.audienceAge}</span></div>` : ''}
          ${brief.audienceType ? `<div class="details-item"><span class="details-label">Audience Type:</span> <span class="details-value">${Array.isArray(brief.audienceType) ? brief.audienceType.join(', ') : brief.audienceType}</span></div>` : ''}
          ${brief.idealCustomer ? `<div class="details-item full-span"><span class="details-label">Ideal Customer:</span> <span class="details-value">${brief.idealCustomer}</span></div>` : ''}
        </div>
      </div>
    `);
  }
  
  // Content Style
  if (brief.personality || brief.visualStyle || brief.videoTone || brief.competitors || brief.dontWant) {
    sections.push(`
      <div class="details-section">
        <div class="details-section-title">🎬 Content Style</div>
        <div class="details-grid">
          ${brief.personality ? `<div class="details-item"><span class="details-label">Personality:</span> <span class="details-value">${Array.isArray(brief.personality) ? brief.personality.join(', ') : brief.personality}</span></div>` : ''}
          ${brief.visualStyle ? `<div class="details-item"><span class="details-label">Visual Style:</span> <span class="details-value">${Array.isArray(brief.visualStyle) ? brief.visualStyle.join(', ') : brief.visualStyle}</span></div>` : ''}
          ${brief.videoTone ? `<div class="details-item"><span class="details-label">Video Tone:</span> <span class="details-value">${Array.isArray(brief.videoTone) ? brief.videoTone.join(', ') : brief.videoTone}</span></div>` : ''}
          ${brief.musicStyle ? `<div class="details-item"><span class="details-label">Music Style:</span> <span class="details-value">${Array.isArray(brief.musicStyle) ? brief.musicStyle.join(', ') : brief.musicStyle}</span></div>` : ''}
          ${brief.competitors ? `<div class="details-item full-span"><span class="details-label">Competitors to study:</span> <span class="details-value">${brief.competitors}</span></div>` : ''}
          ${brief.dontWant ? `<div class="details-item full-span"><span class="details-label">Content to avoid:</span> <span class="details-value">${brief.dontWant}</span></div>` : ''}
        </div>
      </div>
    `);
  }
  
  // Platforms & Posting
  if (brief.platforms || brief.frequency || brief.postingManager || brief.approvalTime || brief.notes) {
    sections.push(`
      <div class="details-section">
        <div class="details-section-title">📱 Platforms & Posting</div>
        <div class="details-grid">
          ${brief.platforms ? `<div class="details-item"><span class="details-label">Platforms:</span> <span class="details-value">${Array.isArray(brief.platforms) ? brief.platforms.join(', ') : brief.platforms}</span></div>` : ''}
          ${brief.frequency ? `<div class="details-item"><span class="details-label">Frequency:</span> <span class="details-value">${brief.frequency}</span></div>` : ''}
          ${brief.postingManager ? `<div class="details-item"><span class="details-label">Posted by:</span> <span class="details-value">${brief.postingManager}</span></div>` : ''}
          ${brief.approvalTime ? `<div class="details-item"><span class="details-label">Approval time:</span> <span class="details-value">${brief.approvalTime}</span></div>` : ''}
          ${brief.notes ? `<div class="details-item full-span"><span class="details-label">Additional notes:</span> <span class="details-value">${brief.notes}</span></div>` : ''}
        </div>
      </div>
    `);
  }
  
  // Metadata
  sections.push(`
    <div class="details-section">
      <div class="details-section-title">📋 Metadata</div>
      <div class="details-grid">
        <div class="details-item"><span class="details-label">Brief ID:</span> <span class="details-value">${brief.id}</span></div>
        <div class="details-item"><span class="details-label">Client ID:</span> <span class="details-value">${brief.clientId}</span></div>
        <div class="details-item"><span class="details-label">Submitted:</span> <span class="details-value">${brief.createdAt ? formatDate(new Date(brief.createdAt.seconds*1000).toISOString().split('T')[0]) : 'N/A'}</span></div>
        <div class="details-item"><span class="details-label">Last updated:</span> <span class="details-value">${brief.updatedAt ? formatDate(new Date(brief.updatedAt.seconds*1000).toISOString().split('T')[0]) : 'N/A'}</span></div>
      </div>
    </div>
  `);
  
  return sections.join('');
}

// Function to print/export brief
window.printBrief = function(briefId) {
  const brief = demoData.briefs.find(b => b.id === briefId);
  if (!brief) return;
  
  // Create a printable version
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
      <title>Brand Brief - ${brief.companyName || brief.clientName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; line-height: 1.6; }
        h1 { color: #C9A84C; border-bottom: 2px solid #C9A84C; padding-bottom: 0.5rem; }
        h2 { color: #333; margin-top: 2rem; }
        .section { margin-bottom: 2rem; }
        .label { font-weight: bold; color: #666; }
        .value { margin-left: 1rem; margin-bottom: 0.5rem; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .footer { margin-top: 3rem; font-size: 0.8rem; color: #999; text-align: center; }
      </style>
    </head>
    <body>
      <h1>Brand Brief: ${brief.companyName || brief.clientName}</h1>
      <p>Submitted: ${brief.createdAt ? new Date(brief.createdAt.seconds*1000).toLocaleDateString() : 'N/A'}</p>
      <p>Status: ${brief.status}</p>
      
      <div class="section">
        <h2>Company Information</h2>
        <div class="grid">
          ${brief.companyName ? `<div><span class="label">Company:</span> <span class="value">${brief.companyName}</span></div>` : ''}
          ${brief.tradingName ? `<div><span class="label">Trading as:</span> <span class="value">${brief.tradingName}</span></div>` : ''}
          ${brief.industry ? `<div><span class="label">Industry:</span> <span class="value">${brief.industry}</span></div>` : ''}
          ${brief.location ? `<div><span class="label">Location:</span> <span class="value">${brief.location}</span></div>` : ''}
          ${brief.phone ? `<div><span class="label">Phone:</span> <span class="value">${brief.phone}</span></div>` : ''}
          ${brief.website ? `<div><span class="label">Website:</span> <span class="value">${brief.website}</span></div>` : ''}
        </div>
      </div>
      
      ${brief.instagram || brief.facebook || brief.tiktok ? `
      <div class="section">
        <h2>Social Media</h2>
        <div>
          ${brief.instagram ? `<div><span class="label">Instagram:</span> <span class="value">${brief.instagram}</span></div>` : ''}
          ${brief.facebook ? `<div><span class="label">Facebook:</span> <span class="value">${brief.facebook}</span></div>` : ''}
          ${brief.tiktok ? `<div><span class="label">TikTok:</span> <span class="value">${brief.tiktok}</span></div>` : ''}
        </div>
      </div>
      ` : ''}
      
      ${brief.tagline || brief.brandValues || brief.logoLink ? `
      <div class="section">
        <h2>Brand Identity</h2>
        <div>
          ${brief.tagline ? `<div><span class="label">Tagline:</span> <span class="value">"${brief.tagline}"</span></div>` : ''}
          ${brief.brandValues ? `<div><span class="label">Brand Values:</span> <span class="value">${brief.brandValues}</span></div>` : ''}
          ${brief.fonts ? `<div><span class="label">Fonts:</span> <span class="value">${brief.fonts}</span></div>` : ''}
          ${brief.logoLink ? `<div><span class="label">Logo Files:</span> <span class="value">${brief.logoLink}</span></div>` : ''}
        </div>
      </div>
      ` : ''}
      
      ${brief.idealCustomer ? `
      <div class="section">
        <h2>Target Audience</h2>
        <div><span class="label">Ideal Customer:</span> <span class="value">${brief.idealCustomer}</span></div>
      </div>
      ` : ''}
      
      ${brief.competitors || brief.dontWant ? `
      <div class="section">
        <h2>Content Preferences</h2>
        <div>
          ${brief.competitors ? `<div><span class="label">Competitors to study:</span> <span class="value">${brief.competitors}</span></div>` : ''}
          ${brief.dontWant ? `<div><span class="label">Content to avoid:</span> <span class="value">${brief.dontWant}</span></div>` : ''}
        </div>
      </div>
      ` : ''}
      
      ${brief.notes ? `
      <div class="section">
        <h2>Additional Notes</h2>
        <div>${brief.notes}</div>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated from Epic Cinematic Films Portal - ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};


async function loadAdminShoots() {
  const shoots = await getData("shoots");
  renderShootsList(shoots);
}

function renderShootsList(shoots) {
  const el = document.getElementById("admin-shoots-list");
  el.innerHTML = shoots.length ? shoots.map(s => `
    <div class="card" onclick="window.openBookingModal('${s.id}')">
      <div class="card-header">
        <div>
          <div class="card-title">${s.clientName}</div>
          <div class="card-sub">${s.serviceType || s.shootType}</div>
        </div>
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
      <div class="card-body">
        <div>📅 ${formatDate(s.shootDate)} at ${formatTime(s.shootTime)}</div>
        <div>📍 ${s.location}</div>
        ${s.details ? `<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-dim)">${s.details.substring(0,60)}...</div>` : ""}
      </div>
      <div class="card-footer">
        ${s.status==="requested"?`<button class="btn-primary btn-sm" onclick="event.stopPropagation();window.confirmBooking('${s.id}')">Confirm</button>`:""}
        ${s.status==="confirmed"?`<button class="btn-primary btn-sm" onclick="event.stopPropagation();window.completeBooking('${s.id}')">Mark Complete</button>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No bookings yet.</div>`;
}

async function loadAdminProducts() {
  const products = await getData("products");
  const el = document.getElementById("admin-products-list");
  
  // Group by category
  const categories = {};
  products.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });
  
  let html = '';
  for (const [category, items] of Object.entries(categories)) {
    html += `<div style="grid-column:1/-1; margin-top:1rem"><h3>${category}</h3></div>`;
    html += items.map(p => `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${p.name}</div>
          <span class="badge ${p.addon ? "badge-purple" : "badge-gold"}">${p.addon ? "Add-on" : "Service"}</span>
        </div>
        <div class="card-body">
          <div>${p.description}</div>
          <div style="margin-top:0.5rem; font-size:1.2rem; color:var(--gold)">KES ${p.basePrice.toLocaleString()}</div>
          <div style="font-size:0.8rem; color:var(--text-dim)">Type: ${p.type}</div>
        </div>
        <div class="card-footer">
          <button class="btn-primary btn-sm" onclick="window.editProduct('${p.id}')">Edit</button>
          <button class="btn-ghost btn-sm" onclick="window.deleteProduct('${p.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }
  
  if (!products.length) {
    html = `<div class="empty-state">No products yet. Click "Add Product Category" to create services.</div>`;
  }
  
  el.innerHTML = html;
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
        <label class="check-item" style="margin-left:auto"><input type="checkbox" ${d.public?"checked":""} onchange="window.togglePublic('${d.id}', this.checked)"/> Public</label>
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
      <div class="card-footer">
        <span class="badge badge-grey">Due: ${i.dueDate||"—"}</span>
        ${i.status!=="paid"?`<button class="btn-primary btn-sm" onclick="window.markInvoicePaid('${i.id}')">Mark Paid</button>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No invoices yet.</div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  CLIENT — DATA LOADERS
// ═══════════════════════════════════════════════════════════════════
async function loadClientDashboard(uid) {
  const [bookings, deliverables, feedback, invoices] = await Promise.all([
    getData("shoots", uid), getData("deliverables", uid),
    getData("feedback", uid), getData("invoices", uid)
  ]);

  document.getElementById("cstat-bookings").textContent = bookings.length;
  document.getElementById("cstat-deliverables").textContent = deliverables.length;
  const unread = feedback.filter(f => !f.isRead).length;
  document.getElementById("cstat-feedback").textContent = unread || "0";

  if (unread > 0) {
    document.getElementById("client-feedback-badge").textContent = unread;
    document.getElementById("client-feedback-badge").classList.add("visible");
    document.getElementById("client-notif-count").textContent = unread;
  }

  // Next booking
  const upcoming = bookings.filter(s => s.status !== "completed" && s.shootDate >= new Date().toISOString().split("T")[0]).sort((a,b) => a.shootDate > b.shootDate ? 1 : -1);
  const nextEl = document.getElementById("client-next-booking");
  if (upcoming.length) {
    const s = upcoming[0];
    nextEl.innerHTML = `
      <div class="shoot-item" style="border:none;background:none;padding:0">
        <div class="shoot-item-title">${s.serviceType || s.shootType}</div>
        <div class="shoot-item-meta">
          <span>📅 ${formatDate(s.shootDate)}</span>
          <span>🕒 ${formatTime(s.shootTime)}</span>
          <span>📍 ${s.location}</span>
        </div>
        <div style="margin-top:0.75rem"><span class="badge ${statusBadge(s.status)}">${s.status}</span></div>
      </div>`;
  } else { nextEl.innerHTML = `<div class="empty-state">No upcoming bookings. <a href="#" data-view="client-bookings">Book now →</a></div>`; }

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
      <div class="deliverable-card" onclick="${d.driveLink?`window.open('${d.driveLink}','_blank')`:""}">
        <div class="deliverable-thumb">${d.thumbnail||"📁"}</div>
        <div class="deliverable-info">
          <div class="deliverable-name">${d.title}</div>
          <div class="deliverable-meta">${d.type} · ${d.date||""}</div>
        </div>
      </div>`).join("");
  } else { delEl.innerHTML = `<div class="empty-state">No deliverables yet.</div>`; }
}

async function loadClientBrief(uid) {
  const briefs = await getData("briefs", uid);
  if (briefs.length) {
    populateForm(document.getElementById("brand-brief-form"), briefs[0]);
    updateBriefCompletion();
  }
}

async function loadClientBookings(uid) {
  const bookings = await getData("shoots", uid);
  const el = document.getElementById("client-bookings-list");
  el.innerHTML = bookings.length ? bookings.map(s => `
    <div class="shoot-item">
      <div class="shoot-item-title">${s.serviceType || s.shootType}</div>
      <div class="shoot-item-meta">
        <span>📅 ${formatDate(s.shootDate)}</span>
        <span>🕒 ${formatTime(s.shootTime)}</span>
        <span>📍 ${s.location}</span>
      </div>
      <div style="margin-top:0.4rem">
        <span class="badge ${statusBadge(s.status)}">${s.status}</span>
      </div>
    </div>`).join("") : `<div class="empty-state">No bookings yet.</div>`;
}

async function loadClientDeliverables(uid) {
  const items = await getData("deliverables", uid);
  const el = document.getElementById("client-deliverables-list");
  el.innerHTML = items.length ? items.map(d => `
    <div class="deliverable-card" onclick="${d.driveLink?`window.open('${d.driveLink}','_blank')`:""}" style="${d.driveLink?"cursor:pointer":""}">
      <div class="deliverable-thumb">${d.thumbnail||"📁"}</div>
      <div class="deliverable-info">
        <div class="deliverable-name">${d.title}</div>
        <div class="deliverable-meta">${d.type} · ${d.date||""}</div>
        ${d.driveLink?`<div style="margin-top:0.4rem"><span class="badge badge-blue">Download ↗</span></div>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No deliverables yet.</div>`;
}

async function loadClientFeedback(uid) {
  const items = await getData("feedback", uid);
  const el = document.getElementById("client-feedback-list");
  el.innerHTML = items.length ? items.map(f => `
    <div class="feedback-card ${f.isRead?"":"unread"}" onclick="window.markFeedbackRead('${f.id}','${uid}',this)">
      <div class="feedback-header">
        <span class="feedback-from">Epic Cinematic Films</span>
        <span class="feedback-date">${f.createdAt ? formatRelativeDate(f.createdAt.seconds) : ""}</span>
      </div>
      <div class="feedback-subject">${f.subject}</div>
      <div class="feedback-body" style="white-space:pre-line">${f.body||""}</div>
    </div>`).join("") : `<div class="empty-state">No feedback yet.</div>`;
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
      <div class="card-footer">
        <span class="badge badge-grey">Due: ${i.dueDate||"—"}</span>
        ${i.status!=="paid"?`<a href="tel:+254715150894" class="badge badge-blue" style="text-decoration:none;cursor:pointer">Pay via M-Pesa ↗</a>`:""}
      </div>
    </div>`).join("") : `<div class="empty-state">No invoices yet.</div>`;
}

function loadClientEstimator() {
  const products = DEMO_MODE ? demoData.products : [];
  const services = products.filter(p => !p.addon);
  const addons = products.filter(p => p.addon);
  
  const container = document.getElementById("estimator-services");
  if (!container) return;
  
  let html = '<div class="form-group"><label>Select Services</label>';
  services.forEach(p => {
    html += `
      <label class="check-item" style="margin-bottom:0.5rem; width:100%; justify-content:space-between">
        <span>
          <input type="checkbox" class="estimator-service" data-price="${p.basePrice}" data-id="${p.id}"/>
          ${p.name} - ${p.description}
        </span>
        <span style="color:var(--gold)">KES ${p.basePrice.toLocaleString()}</span>
      </label>`;
  });
  html += '</div>';
  
  html += '<div class="form-group"><label>Add-ons</label>';
  addons.forEach(p => {
    html += `
      <label class="check-item" style="margin-bottom:0.5rem; width:100%; justify-content:space-between">
        <span>
          <input type="checkbox" class="estimator-addon" data-price="${p.basePrice}" data-id="${p.id}"/>
          ${p.name} - ${p.description}
        </span>
        <span style="color:var(--gold)">KES ${p.basePrice.toLocaleString()}</span>
      </label>`;
  });
  html += '</div>';
  
  container.innerHTML = html;
  
  // Add event listeners
  document.querySelectorAll(".estimator-service, .estimator-addon").forEach(cb => {
    cb.addEventListener("change", updateEstimatorTotal);
  });
}

function updateEstimatorTotal() {
  let total = 0;
  document.querySelectorAll(".estimator-service:checked, .estimator-addon:checked").forEach(cb => {
    total += parseFloat(cb.dataset.price || 0);
  });
  const totalEl = document.getElementById("estimator-total");
  if (totalEl) totalEl.textContent = "KES " + total.toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════
//  GUEST FEATURES
// ═══════════════════════════════════════════════════════════════════
function loadGuestEstimator() {
  const products = DEMO_MODE ? demoData.products : [];
  const services = products.filter(p => !p.addon);
  const addons = products.filter(p => p.addon);
  
  const container = document.getElementById("guest-estimator-services");
  if (!container) return;
  
  let html = '<div class="form-group"><label>Select Services</label>';
  services.forEach(p => {
    html += `
      <label class="check-item" style="margin-bottom:0.5rem; width:100%; justify-content:space-between">
        <span>
          <input type="checkbox" class="guest-estimator-service" data-price="${p.basePrice}" data-id="${p.id}"/>
          ${p.name} - ${p.description}
        </span>
        <span style="color:var(--gold)">KES ${p.basePrice.toLocaleString()}</span>
      </label>`;
  });
  html += '</div>';
  
  html += '<div class="form-group"><label>Add-ons</label>';
  addons.forEach(p => {
    html += `
      <label class="check-item" style="margin-bottom:0.5rem; width:100%; justify-content:space-between">
        <span>
          <input type="checkbox" class="guest-estimator-addon" data-price="${p.basePrice}" data-id="${p.id}"/>
          ${p.name} - ${p.description}
        </span>
        <span style="color:var(--gold)">KES ${p.basePrice.toLocaleString()}</span>
      </label>`;
  });
  html += '</div>';
  
  container.innerHTML = html;
  
  document.querySelectorAll(".guest-estimator-service, .guest-estimator-addon").forEach(cb => {
    cb.addEventListener("change", updateGuestEstimatorTotal);
  });
  
  const contactBtn = document.getElementById("guest-contact-cta");
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      const total = document.getElementById("guest-estimator-total").textContent;
      navigateTo("guest-contact");
      setTimeout(() => {
        const message = `I'm interested in services estimated at ${total}. Please contact me with more information.`;
        const msgEl = document.getElementById("guest-message");
        if (msgEl) msgEl.value = message;
      }, 100);
    });
  }
  
  const resetBtn = document.getElementById("guest-reset-estimator");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".guest-estimator-service, .guest-estimator-addon").forEach(cb => cb.checked = false);
      updateGuestEstimatorTotal();
    });
  }
}

function updateGuestEstimatorTotal() {
  let total = 0;
  document.querySelectorAll(".guest-estimator-service:checked, .guest-estimator-addon:checked").forEach(cb => {
    total += parseFloat(cb.dataset.price || 0);
  });
  const totalEl = document.getElementById("guest-estimator-total");
  if (totalEl) totalEl.textContent = "KES " + total.toLocaleString();
}

function loadGuestServices() {
  const products = DEMO_MODE ? demoData.products : [];
  const services = products.filter(p => !p.addon);
  
  const container = document.getElementById("guest-services-list");
  if (!container) return;
  
  // Group by category
  const categories = {};
  services.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });
  
  let html = '';
  for (const [category, items] of Object.entries(categories)) {
    html += `<div style="grid-column:1/-1"><h4>${category}</h4></div>`;
    items.forEach(p => {
      html += `
        <div class="project-type-card">
          <div class="project-type-icon">${p.type === 'video' ? '🎬' : p.type === 'photos' ? '📷' : '📹'}</div>
          <div class="project-type-name">${p.name}</div>
          <div class="project-type-desc">${p.description}</div>
          <div class="project-type-price">KES ${p.basePrice.toLocaleString()}</div>
        </div>`;
    });
  }
  
  container.innerHTML = html;
}

function loadGuestPortfolio() {
  const deliverables = DEMO_MODE ? demoData.deliverables.filter(d => d.public) : [];
  const container = document.getElementById("guest-portfolio-grid");
  if (!container) return;
  
  if (deliverables.length) {
    container.innerHTML = deliverables.map(d => `
      <div class="deliverable-card" onclick="${d.driveLink?`window.open('${d.driveLink}','_blank')`:""}">
        <div class="deliverable-thumb">${d.thumbnail||"📁"}</div>
        <div class="deliverable-info">
          <div class="deliverable-name">${d.title}</div>
          <div class="deliverable-meta">${d.type} · ${d.date||""}</div>
        </div>
      </div>`).join("");
  } else {
    container.innerHTML = `<div class="empty-state">Portfolio coming soon.</div>`;
  }
}

function setupGuestContact() {
  const form = document.getElementById("guest-contact-form");
  if (!form) return;
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("guest-name").value;
    const email = document.getElementById("guest-email").value;
    const message = document.getElementById("guest-message").value;
    
    if (DEMO_MODE) {
      showToast(`Message sent! (Demo) - We'll contact ${email} soon.`, "success");
      e.target.reset();
    } else {
      // In production, send to Firebase or email
      showToast("Thank you! We'll contact you within 24 hours.", "success");
      e.target.reset();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  CALENDAR
// ═══════════════════════════════════════════════════════════════════
let currentCalendarDate = new Date();
let selectedCalendarDate = null;
let clientBookings = [];

function setupBookingCalendar(uid) {
  const prevBtn = document.getElementById("calendar-prev");
  const nextBtn = document.getElementById("calendar-next");
  
  if (prevBtn) prevBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar(uid);
  });
  
  if (nextBtn) nextBtn.addEventListener("click", () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar(uid);
  });
  
  // Load existing bookings for this client
  loadClientBookingsForCalendar(uid);
  renderCalendar(uid);
  
  // Populate service types
  populateServiceTypes();
  populateAddons();
}

async function loadClientBookingsForCalendar(uid) {
  clientBookings = await getData("shoots", uid);
}

function renderCalendar(uid) {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  const monthYearEl = document.getElementById("calendar-month-year");
  if (monthYearEl) monthYearEl.textContent = `${monthNames[month]} ${year}`;
  
  let daysHtml = '';
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay.getDay(); i++) {
    daysHtml += '<div class="calendar-day empty"></div>';
  }
  
  // Add days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const currentDate = new Date(year, month, d);
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isPast = currentDate < today;
    const hasBooking = clientBookings.some(b => b.shootDate === dateStr);
    const isSelected = selectedCalendarDate === dateStr;
    
    let classes = 'calendar-day';
    if (isPast) classes += ' past';
    if (isToday) classes += ' today';
    if (hasBooking) classes += ' has-shoot';
    if (isSelected) classes += ' selected';
    
    daysHtml += `
      <div class="${classes}" data-date="${dateStr}" ${isPast ? '' : 'onclick="window.selectCalendarDate(\''+dateStr+'\')"'}>
        ${d}
        ${hasBooking ? '<span class="booking-indicator">📅</span>' : ''}
      </div>`;
  }
  
  const daysEl = document.getElementById("calendar-days");
  if (daysEl) daysEl.innerHTML = daysHtml;
}

window.selectCalendarDate = function(dateStr) {
  selectedCalendarDate = dateStr;
  document.querySelectorAll(".calendar-day").forEach(day => day.classList.remove("selected"));
  const selectedDay = document.querySelector(`[data-date="${dateStr}"]`);
  if (selectedDay) selectedDay.classList.add("selected");
  const dateInput = document.getElementById("selected-date");
  if (dateInput) dateInput.value = formatDate(dateStr);
};

function populateServiceTypes() {
  const select = document.getElementById("service-type-select");
  if (!select) return;
  
  const products = DEMO_MODE ? demoData.products.filter(p => !p.addon) : [];
  
  select.innerHTML = '<option value="">Select service...</option>';
  products.forEach(p => {
    select.innerHTML += `<option value="${p.id}" data-price="${p.basePrice}">${p.name} - KES ${p.basePrice.toLocaleString()}</option>`;
  });
}

function populateAddons() {
  const container = document.getElementById("addons-container");
  if (!container) return;
  
  const addons = DEMO_MODE ? demoData.products.filter(p => p.addon) : [];
  
  container.innerHTML = '';
  addons.forEach(p => {
    container.innerHTML += `
      <label class="check-item">
        <input type="checkbox" name="addons" value="${p.id}" data-price="${p.basePrice}"/>
        <span>${p.name} (+KES ${p.basePrice.toLocaleString()})</span>
      </label>`;
  });
}

// ═══════════════════════════════════════════════════════════════════
//  FORMS
// ═══════════════════════════════════════════════════════════════════
function setupBriefForm() {
  const form = document.getElementById("brand-brief-form");
  if (!form) return;

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

  const saveDraftBtn = document.getElementById("btn-save-draft");
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      const data = collectFormData(form);
      localStorage.setItem("ecf_brief_draft_" + (currentUser?.uid||"guest"), JSON.stringify(data));
      showToast("Draft saved locally.", "info");
    });
  }

  const draft = localStorage.getItem("ecf_brief_draft_" + (currentUser?.uid||"guest"));
  if (draft) {
    try { populateForm(form, JSON.parse(draft)); updateBriefCompletion(); } catch(e) {}
  }

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
      demoData.feedback.unshift({ id:"auto_"+Date.now(), clientId:"admin001", subject:"New brand brief submitted", body:`${data.companyName} has submitted their brand brief.`, isRead:false, createdAt:{ seconds:Date.now()/1000 } });
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
  let filled = 0; let total = inputs.length;
  inputs.forEach(el => { if (el.value.trim()) filled++; });
  const pct = Math.min(100, Math.round((filled / total) * 100));
  const pctEl = document.getElementById("brief-pct");
  const fillEl = document.getElementById("brief-fill");
  if (pctEl) pctEl.textContent = pct + "%";
  if (fillEl) fillEl.style.width = pct + "%";
}

function setupBookingForm() {
  const form = document.getElementById("booking-form");
  if (!form) return;

  const dateInput = form.querySelector("[name=bookingDate]");
  if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const serviceSelect = document.getElementById("service-type-select");
    if (!serviceSelect || !serviceSelect.value) {
      showToast("Please select a service", "error");
      return;
    }
    
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];
    const serviceName = selectedService.text.split(" - ")[0];
    const servicePrice = selectedService.dataset.price || 0;
    
    const addons = [];
    document.querySelectorAll("input[name='addons']:checked").forEach(cb => {
      addons.push(cb.value);
    });
    
    if (!selectedCalendarDate) {
      showToast("Please select a date from the calendar", "error");
      return;
    }
    
    const data = {
      serviceType: serviceName,
      serviceId: serviceSelect.value,
      shootDate: selectedCalendarDate,
      shootTime: form.querySelector("[name=bookingTime]").value,
      location: form.querySelector("[name=location]").value,
      details: form.querySelector("[name=details]").value,
      estimatedBudget: form.querySelector("[name=estimatedBudget]").value,
      addons: addons,
      instructions: form.querySelector("[name=instructions]").value,
      clientId: currentUser?.uid || "guest",
      clientName: document.getElementById("client-brand-name")?.textContent || "",
      status: "requested",
      createdAt: DEMO_MODE ? { seconds: Date.now()/1000 } : serverTimestamp()
    };

    if (DEMO_MODE) {
      const id = "sh_" + Date.now();
      demoData.shoots.push({ id, ...data });
      showToast("Booking request sent! We'll confirm within 24 hours.", "success");
      demoData.feedback.unshift({ id:"auto_"+Date.now(), clientId:"admin001", subject:"New booking request", body:`${data.clientName} has requested a booking.`, isRead:false, createdAt:{ seconds:Date.now()/1000 } });
      form.reset();
      selectedCalendarDate = null;
      if (currentUser?.uid) {
        loadClientBookings(currentUser.uid);
        loadClientDashboard(currentUser.uid);
        renderCalendar(currentUser.uid);
      }
    } else {
      try {
        await addDoc(collection(db, "shoots"), data);
        showToast("Booking requested! We'll confirm within 24 hours.", "success");
        form.reset();
        if (currentUser?.uid) loadClientBookings(currentUser.uid);
      } catch(err) { showToast("Failed to request booking: " + err.message, "error"); }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN ACTIONS
// ═══════════════════════════════════════════════════════════════════
function setupAdminActions() {
  const inviteBtn = document.getElementById("btn-invite-client");
  if (inviteBtn) inviteBtn.addEventListener("click", openInviteModal);
  
  const feedbackBtn = document.getElementById("btn-send-feedback");
  if (feedbackBtn) feedbackBtn.addEventListener("click", () => openFeedbackModal(null, null, null));
  
  const deliverableBtn = document.getElementById("btn-add-deliverable");
  if (deliverableBtn) deliverableBtn.addEventListener("click", () => openAddDeliverableModal(null, null, null));
  
  const invoiceBtn = document.getElementById("btn-create-invoice");
  if (invoiceBtn) invoiceBtn.addEventListener("click", openCreateInvoiceModal);
  
  const bookingBtn = document.getElementById("btn-create-booking");
  if (bookingBtn) bookingBtn.addEventListener("click", openCreateBookingModal);
  
  const productBtn = document.getElementById("btn-add-product");
  if (productBtn) productBtn.addEventListener("click", openAddProductModal);

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
  const clientSearch = document.getElementById("client-search");
  if (clientSearch) {
    clientSearch.addEventListener("input", async (e) => {
      const q = e.target.value.toLowerCase();
      const all = await getData("clients");
      const filtered = all.filter(c =>
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.contactName?.toLowerCase().includes(q)
      );
      const el = document.getElementById("admin-clients-list");
      if (el) {
        el.innerHTML = filtered.length ? filtered.map(c => `
          <div class="card" onclick="window.openClientModal('${c.uid}')">
            <div class="card-header"><div>
              <div class="card-title">${c.company}</div>
              <div class="card-sub">${c.contactName}</div>
            </div><span class="badge badge-green">${c.status||"active"}</span></div>
            <div class="card-body">${c.email}</div>
          </div>`).join("") : `<div class="empty-state">No clients match "${e.target.value}"</div>`;
      }
    });
  }

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

// ─── MODALS ───────────────────────────────────────────────────────
function openInviteModal() {
  openModal("Invite New Client", `
    <div class="form-group"><label>Email Address</label><input type="email" id="invite-email" placeholder="client@company.com"/></div>
    <div class="form-group"><label>Company Name</label><input type="text" id="invite-company" placeholder="ABC Ltd"/></div>
    <div class="form-group"><label>Contact Person</label><input type="text" id="invite-name"/></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="invite-phone" placeholder="+254 7XX XXX XXX"/></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitInvite()">Send Invite</button>
    </div>
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
  const clients = DEMO_MODE ? demoData.clients : [];
  openModal("Send Feedback to Client", `
    <div class="form-group"><label>Client</label>
      <select id="fb-client-select">
        ${clients.map(c=>`<option value="${c.uid}" ${c.uid===clientId?"selected":""}>${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Subject</label><input type="text" id="fb-subject" placeholder="e.g. Project Recommendations"/></div>
    <div class="form-group"><label>Tags</label>
      <div class="check-group">
        <label class="check-item"><input type="checkbox" name="fb-tags" value="creative"/><span>Creative</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="strategy"/><span>Strategy</span></label>
        <label class="check-item"><input type="checkbox" name="fb-tags" value="scheduling"/><span>Scheduling</span></label>
      </div>
    </div>
    <div class="form-group"><label>Message</label><textarea id="fb-body" rows="6"></textarea></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitFeedback()">Send Feedback</button>
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
  const clients = DEMO_MODE ? demoData.clients : [];
  openModal("Add Deliverable", `
    <div class="form-group"><label>Client</label>
      <select id="del-client-select">
        ${clients.map(c=>`<option value="${c.uid}" ${c.uid===clientId?"selected":""}>${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Title</label><input type="text" id="del-title"/></div>
    <div class="form-group"><label>Type</label>
      <select id="del-type">
        <option value="photos">Photos</option>
        <option value="video">Video</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="form-group"><label>Google Drive Link</label><input type="url" id="del-link"/></div>
    <div class="form-group"><label>Date Delivered</label><input type="date" id="del-date"/></div>
    <div class="form-group"><label><input type="checkbox" id="del-public" checked/> Make public (show in portfolio)</label></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitDeliverable()">Add Deliverable</button>
    </div>
  `);
  const dateEl = document.getElementById("del-date");
  if (dateEl) dateEl.value = new Date().toISOString().split("T")[0];
};

window.submitDeliverable = async function() {
  const clientId = document.getElementById("del-client-select")?.value;
  const title = document.getElementById("del-title")?.value?.trim();
  const type = document.getElementById("del-type")?.value;
  const driveLink = document.getElementById("del-link")?.value?.trim();
  const date = document.getElementById("del-date")?.value;
  const isPublic = document.getElementById("del-public")?.checked;
  if (!clientId||!title) { showToast("Client and title required.", "error"); return; }

  const client = demoData.clients.find(c=>c.uid===clientId)||{company:"Client"};
  const icons = { photos:"🖼️", video:"🎬", other:"📁" };
  const item = { id:"del_"+Date.now(), clientId, clientName:client.company, title, type, driveLink, date, public: isPublic, thumbnail:icons[type]||"📁", createdAt:{ seconds:Date.now()/1000 } };

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

window.togglePublic = async function(id, isPublic) {
  if (DEMO_MODE) {
    const item = demoData.deliverables.find(d => d.id === id);
    if (item) item.public = isPublic;
    showToast(`Deliverable ${isPublic ? "now public" : "hidden"}`, "info");
  } else {
    try {
      await updateDoc(doc(db, "deliverables", id), { public: isPublic });
      showToast("Updated", "success");
    } catch(e) { showToast("Error: " + e.message, "error"); }
  }
};

function openCreateInvoiceModal() {
  const clients = DEMO_MODE ? demoData.clients : [];
  openModal("Create Invoice", `
    <div class="form-group"><label>Client</label>
      <select id="inv-client-select">
        ${clients.map(c=>`<option value="${c.uid}">${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Invoice Number</label><input type="text" id="inv-number" value="ECF-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3,"0")}"/></div>
    <div class="form-group"><label>Amount (KES)</label><input type="number" id="inv-amount" min="0"/></div>
    <div class="form-group"><label>Description</label><input type="text" id="inv-desc"/></div>
    <div class="form-group"><label>Due Date</label><input type="date" id="inv-due"/></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitInvoice()">Create Invoice</button>
    </div>
  `);
  const due = new Date(); due.setDate(due.getDate()+7);
  const dueEl = document.getElementById("inv-due");
  if (dueEl) dueEl.value = due.toISOString().split("T")[0];
}

window.submitInvoice = async function() {
  const clientId = document.getElementById("inv-client-select")?.value;
  const number = document.getElementById("inv-number")?.value?.trim();
  const amount = parseFloat(document.getElementById("inv-amount")?.value)||0;
  const description = document.getElementById("inv-desc")?.value?.trim();
  const dueDate = document.getElementById("inv-due")?.value;
  if (!clientId||!number||!amount) { showToast("Please fill in all fields.", "error"); return; }

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

function openCreateBookingModal() {
  const clients = DEMO_MODE ? demoData.clients : [];
  const products = DEMO_MODE ? demoData.products.filter(p => !p.addon) : [];
  
  openModal("Create Booking (Admin)", `
    <div class="form-group"><label>Client</label>
      <select id="cs-client">
        ${clients.map(c=>`<option value="${c.uid}|${c.company}">${c.company}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Service</label>
      <select id="cs-service">
        ${products.map(p => `<option value="${p.id}" data-price="${p.basePrice}">${p.name}</option>`).join("")}
      </select>
    </div>
    <div class="form-group"><label>Date</label><input type="date" id="cs-date"/></div>
    <div class="form-group"><label>Time</label>
      <select id="cs-time">
        <option value="07:00">7:00 AM</option>
        <option value="09:00">9:00 AM</option>
        <option value="14:00">2:00 PM</option>
        <option value="17:00">5:00 PM</option>
      </select>
    </div>
    <div class="form-group"><label>Location</label><input type="text" id="cs-location"/></div>
    <div class="form-group"><label>Details</label><textarea id="cs-details" rows="2"></textarea></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitAdminBooking()">Create Booking</button>
    </div>
  `);
  const dateEl = document.getElementById("cs-date");
  if (dateEl) dateEl.value = new Date().toISOString().split("T")[0];
}

window.submitAdminBooking = async function() {
  const cv = document.getElementById("cs-client")?.value?.split("|");
  const clientId = cv?.[0], clientName = cv?.[1];
  const serviceSelect = document.getElementById("cs-service");
  const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
  const shootDate = document.getElementById("cs-date")?.value;
  const shootTime = document.getElementById("cs-time")?.value;
  const location = document.getElementById("cs-location")?.value?.trim();
  const details = document.getElementById("cs-details")?.value?.trim();
  
  if (!clientId||!shootDate||!location) { showToast("Please fill in all fields.", "error"); return; }

  const booking = { 
    id:"sh_"+Date.now(), 
    clientId, 
    clientName, 
    serviceType: serviceName,
    shootDate, 
    shootTime, 
    location, 
    details,
    status:"confirmed", 
    createdAt:{ seconds:Date.now()/1000 } 
  };
  
  if (DEMO_MODE) {
    demoData.shoots.push(booking);
    closeModal(); 
    showToast("Booking created for " + clientName, "success");
    loadAdminShoots(); 
    loadAdminDashboard();
  } else {
    try {
      await addDoc(collection(db, "shoots"), { ...booking, createdAt: serverTimestamp() });
      closeModal(); 
      showToast("Booking created!", "success");
      loadAdminShoots();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

function openAddProductModal() {
  openModal("Add Product/Service", `
    <div class="form-group"><label>Category</label>
      <select id="prod-category">
        <option value="Automotive">Automotive</option>
        <option value="Video">Video</option>
        <option value="Events">Events</option>
        <option value="Commercial">Commercial</option>
        <option value="Add-ons">Add-ons</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div class="form-group"><label>Product Name</label><input type="text" id="prod-name"/></div>
    <div class="form-group"><label>Description</label><input type="text" id="prod-desc"/></div>
    <div class="form-group"><label>Base Price (KES)</label><input type="number" id="prod-price" min="0"/></div>
    <div class="form-group"><label>Type</label>
      <select id="prod-type">
        <option value="photos">Photos</option>
        <option value="video">Video</option>
        <option value="event">Event</option>
        <option value="commercial">Commercial</option>
        <option value="addon">Add-on</option>
      </select>
    </div>
    <div class="form-group"><label><input type="checkbox" id="prod-addon"/> This is an add-on</label></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.submitProduct()">Add Product</button>
    </div>
  `);
}

window.submitProduct = async function() {
  const category = document.getElementById("prod-category")?.value;
  const name = document.getElementById("prod-name")?.value?.trim();
  const description = document.getElementById("prod-desc")?.value?.trim();
  const price = parseFloat(document.getElementById("prod-price")?.value) || 0;
  const type = document.getElementById("prod-type")?.value;
  const isAddon = document.getElementById("prod-addon")?.checked;
  
  if (!name || !price) { showToast("Name and price required.", "error"); return; }
  
  const product = {
    id: "prod_" + Date.now(),
    category,
    name,
    description,
    basePrice: price,
    type,
    addon: isAddon
  };
  
  if (DEMO_MODE) {
    demoData.products.push(product);
    closeModal();
    showToast("Product added successfully!", "success");
    loadAdminProducts();
  } else {
    try {
      await addDoc(collection(db, "products"), product);
      closeModal();
      showToast("Product added!", "success");
      loadAdminProducts();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

window.editProduct = function(id) {
  const product = demoData.products.find(p => p.id === id);
  if (!product) return;
  
  openModal("Edit Product", `
    <div class="form-group"><label>Category</label>
      <select id="edit-prod-category">
        <option value="Automotive" ${product.category==="Automotive"?"selected":""}>Automotive</option>
        <option value="Video" ${product.category==="Video"?"selected":""}>Video</option>
        <option value="Events" ${product.category==="Events"?"selected":""}>Events</option>
        <option value="Commercial" ${product.category==="Commercial"?"selected":""}>Commercial</option>
        <option value="Add-ons" ${product.category==="Add-ons"?"selected":""}>Add-ons</option>
        <option value="Other" ${product.category==="Other"?"selected":""}>Other</option>
      </select>
    </div>
    <div class="form-group"><label>Product Name</label><input type="text" id="edit-prod-name" value="${product.name}"/></div>
    <div class="form-group"><label>Description</label><input type="text" id="edit-prod-desc" value="${product.description}"/></div>
    <div class="form-group"><label>Base Price (KES)</label><input type="number" id="edit-prod-price" value="${product.basePrice}" min="0"/></div>
    <div class="form-group"><label>Type</label>
      <select id="edit-prod-type">
        <option value="photos" ${product.type==="photos"?"selected":""}>Photos</option>
        <option value="video" ${product.type==="video"?"selected":""}>Video</option>
        <option value="event" ${product.type==="event"?"selected":""}>Event</option>
        <option value="commercial" ${product.type==="commercial"?"selected":""}>Commercial</option>
        <option value="addon" ${product.type==="addon"?"selected":""}>Add-on</option>
      </select>
    </div>
    <div class="form-group"><label><input type="checkbox" id="edit-prod-addon" ${product.addon?"checked":""}/> This is an add-on</label></div>
    <div class="brief-actions">
      <button class="btn-primary" onclick="window.updateProduct('${id}')">Update Product</button>
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
};

window.updateProduct = async function(id) {
  const category = document.getElementById("edit-prod-category")?.value;
  const name = document.getElementById("edit-prod-name")?.value?.trim();
  const description = document.getElementById("edit-prod-desc")?.value?.trim();
  const price = parseFloat(document.getElementById("edit-prod-price")?.value) || 0;
  const type = document.getElementById("edit-prod-type")?.value;
  const isAddon = document.getElementById("edit-prod-addon")?.checked;
  
  if (!name || !price) { showToast("Name and price required.", "error"); return; }
  
  if (DEMO_MODE) {
    const product = demoData.products.find(p => p.id === id);
    if (product) {
      product.category = category;
      product.name = name;
      product.description = description;
      product.basePrice = price;
      product.type = type;
      product.addon = isAddon;
    }
    closeModal();
    showToast("Product updated successfully!", "success");
    loadAdminProducts();
  } else {
    try {
      await updateDoc(doc(db, "products", id), { category, name, description, basePrice: price, type, addon: isAddon });
      closeModal();
      showToast("Product updated!", "success");
      loadAdminProducts();
    } catch(e) { showToast("Failed: " + e.message, "error"); }
  }
};

window.deleteProduct = async function(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  if (DEMO_MODE) {
    demoData.products = demoData.products.filter(p => p.id !== id);
    showToast("Product deleted.", "info");
    loadAdminProducts();
  } else {
    try {
      await deleteDoc(doc(db, "products", id));
      showToast("Product deleted.", "success");
      loadAdminProducts();
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

window.confirmBooking = async function(id) {
  if (DEMO_MODE) {
    const s = demoData.shoots.find(x=>x.id===id);
    if (s) { s.status = "confirmed"; showToast("Booking confirmed!","success"); loadAdminShoots(); loadAdminDashboard(); }
  } else {
    try { await updateDoc(doc(db,"shoots",id),{status:"confirmed"}); showToast("Booking confirmed!","success"); loadAdminShoots(); } catch(e) { showToast("Error: "+e.message,"error"); }
  }
};

window.completeBooking = async function(id) {
  if (DEMO_MODE) {
    const s = demoData.shoots.find(x=>x.id===id);
    if (s) { s.status = "completed"; showToast("Booking marked complete!","success"); loadAdminShoots(); loadAdminDashboard(); }
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
  
  const briefs = demoData.briefs.filter(b => b.clientId === uid);
  const shoots = demoData.shoots.filter(s => s.clientId === uid);
  
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
        <div><strong>Briefs:</strong> ${briefs.length}</div>
        <div><strong>Bookings:</strong> ${shoots.length}</div>
        <div style="margin-top:0.4rem"><strong>Joined:</strong> ${c.joinedAt ? formatDate(new Date(c.joinedAt.seconds*1000).toISOString().split("T")[0]) : "N/A"}</div>
      </div>
    </div>
    <div class="brief-actions" style="margin-top:1rem">
      <button class="btn-primary btn-sm" onclick="window.openFeedbackModal(null,'${c.uid}','${c.company}');closeModal()">Send Feedback</button>
      <button class="btn-ghost btn-sm" onclick="window.openCreateInvoiceModal();closeModal()">Create Invoice</button>
    </div>
  `);
};

window.openBriefModal = function(id) {
  const b = demoData.briefs.find(x=>x.id===id);
  if (!b) return;
  
  let detailsHtml = '';
  for (const [key, value] of Object.entries(b)) {
    if (key.includes('Id') || key === 'id' || key === 'createdAt' || !value) continue;
    if (Array.isArray(value)) {
      detailsHtml += `<div class="details-item"><span class="details-label">${key}:</span> <span class="details-value">${value.join(', ')}</span></div>`;
    } else if (typeof value === 'object') {
      // skip
    } else {
      detailsHtml += `<div class="details-item"><span class="details-label">${key}:</span> <span class="details-value">${value}</span></div>`;
    }
  }
  
  openModal("Brand Brief — " + (b.companyName||b.clientName), `
    <div class="details-section">
      <div class="details-section-title">Brief Details</div>
      <div class="details-grid">
        ${detailsHtml}
      </div>
    </div>
    <div class="brief-actions">
      <button class="btn-primary btn-sm" onclick="window.approveBrief('${b.id}')">Approve Brief</button>
      <button class="btn-ghost btn-sm" onclick="window.openFeedbackModal('${b.id}','${b.clientId}','${b.companyName||b.clientName}')">Send Feedback</button>
    </div>
  `);
};

window.openBookingModal = function(id) {
  const b = demoData.shoots.find(x=>x.id===id);
  if (!b) return;
  
  openModal("Booking Details", `
    <div class="details-section">
      <div class="details-section-title">Booking Information</div>
      <div class="details-grid">
        <div class="details-item"><span class="details-label">Client:</span> <span class="details-value">${b.clientName}</span></div>
        <div class="details-item"><span class="details-label">Service:</span> <span class="details-value">${b.serviceType || b.shootType}</span></div>
        <div class="details-item"><span class="details-label">Date:</span> <span class="details-value">${formatDate(b.shootDate)}</span></div>
        <div class="details-item"><span class="details-label">Time:</span> <span class="details-value">${formatTime(b.shootTime)}</span></div>
        <div class="details-item"><span class="details-label">Location:</span> <span class="details-value">${b.location}</span></div>
        <div class="details-item"><span class="details-label">Status:</span> <span class="badge ${statusBadge(b.status)}">${b.status}</span></div>
        ${b.details ? `<div class="details-item full-span"><span class="details-label">Details:</span> <span class="details-value">${b.details}</span></div>` : ''}
        ${b.instructions ? `<div class="details-item full-span"><span class="details-label">Instructions:</span> <span class="details-value">${b.instructions}</span></div>` : ''}
      </div>
    </div>
    <div class="brief-actions">
      ${b.status==="requested"?`<button class="btn-primary btn-sm" onclick="window.confirmBooking('${b.id}');closeModal()">Confirm</button>`:""}
      ${b.status==="confirmed"?`<button class="btn-primary btn-sm" onclick="window.completeBooking('${b.id}');closeModal()">Mark Complete</button>`:""}
      <button class="btn-ghost btn-sm" onclick="closeModal()">Close</button>
    </div>
  `);
};

// ─── CLIENT ACTIONS ───────────────────────────────────────────────
function setupClientActions(uid) {
  const signoutBtn = document.getElementById("client-signout");
  if (signoutBtn) signoutBtn.addEventListener("click", handleSignOut);
  
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const company = document.getElementById("profile-company")?.value?.trim();
      const contactName = document.getElementById("profile-contact")?.value?.trim();
      const phone = document.getElementById("profile-phone")?.value?.trim();
      if (DEMO_MODE) {
        const u = Object.values(demoData.users).find(x=>x.uid===uid);
        if (u) { u.company = company; u.contactName = contactName; u.phone = phone; }
        const brandEl = document.getElementById("client-brand-name");
        if (brandEl) brandEl.textContent = company?.toUpperCase() || "MY COMPANY";
        const welcomeEl = document.getElementById("client-welcome-name");
        if (welcomeEl && contactName) welcomeEl.textContent = "Welcome back, " + contactName.split(" ")[0];
        showToast("Profile updated.", "success");
      } else {
        try { await updateDoc(doc(db,"users",uid),{ company, contactName, phone }); showToast("Profile updated!","success"); } catch(e) { showToast("Error: "+e.message,"error"); }
      }
    });
  }

  const welcomeCta = document.querySelector(".welcome-cta .btn-primary");
  if (welcomeCta) welcomeCta.addEventListener("click", () => navigateTo("client-bookings"));
  
  const resetBtn = document.getElementById("reset-estimator");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      document.querySelectorAll(".estimator-service, .estimator-addon").forEach(cb => cb.checked = false);
      updateEstimatorTotal();
    });
  }
}

window.markFeedbackRead = async function(id, uid, cardEl) {
  if (DEMO_MODE) {
    const f = demoData.feedback.find(x=>x.id===id);
    if (f) { f.isRead = true; if (cardEl) cardEl.classList.remove("unread"); }
  } else {
    try { await updateDoc(doc(db,"feedback",id),{isRead:true}); if (cardEl) cardEl.classList.remove("unread"); } catch(e) {}
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
    const loginEmail = document.getElementById("login-email");
    const loginPass = document.getElementById("login-password");
    if (loginEmail) loginEmail.value = "";
    if (loginPass) loginPass.value = "";
    showScreen("auth-screen");
  } else {
    await signOut(auth);
  }
}

const adminSignout = document.getElementById("admin-signout");
if (adminSignout) adminSignout.addEventListener("click", handleSignOut);

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
  const prefix = portal;
  const titleMap = {
    "admin-dashboard":"Dashboard","admin-clients":"Clients","admin-briefs":"Brand Briefs",
    "admin-shoots":"Bookings","admin-products":"Products & Pricing","admin-feedback":"Feedback",
    "admin-gallery":"Deliverables","admin-invoices":"Invoices",
    "client-dashboard":"Dashboard","client-brief":"Brand Brief","client-bookings":"Book Services",
    "client-deliverables":"Deliverables","client-feedback":"Feedback","client-invoices":"Invoices",
    "client-estimator":"Cost Estimator","client-profile":"My Profile",
    "guest-estimator":"Cost Estimator","guest-services":"Our Services",
    "guest-portfolio":"Portfolio","guest-contact":"Contact Us"
  };

  const portalScreen = document.getElementById(`${portal}-screen`);
  if (portalScreen) {
    portalScreen.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  }
  
  const portalSidebar = document.getElementById(`${portal}-sidebar`);
  if (portalSidebar) {
    portalSidebar.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  }

  const targetView = document.getElementById("view-" + viewId);
  if (targetView) targetView.classList.add("active");

  const targetNav = document.querySelector(`#${portal}-sidebar [data-view="${viewId}"]`);
  if (targetNav) targetNav.classList.add("active");

  const titleEl = document.getElementById(`${portal}-view-title`);
  if (titleEl) titleEl.textContent = titleMap[viewId] || viewId;

  closeSidebar(portal);
}

// ─── SIDEBAR MOBILE ───────────────────────────────────────────────
function setupSidebar() {
  const backdrop = document.createElement("div");
  backdrop.id = "sidebar-backdrop";
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", () => { closeSidebar("admin"); closeSidebar("client"); closeSidebar("guest"); });

  const adminHamburger = document.getElementById("admin-hamburger");
  if (adminHamburger) adminHamburger.addEventListener("click", () => toggleSidebar("admin"));
  
  const clientHamburger = document.getElementById("client-hamburger");
  if (clientHamburger) clientHamburger.addEventListener("click", () => toggleSidebar("client"));
  
  const guestHamburger = document.getElementById("guest-hamburger");
  if (guestHamburger) guestHamburger.addEventListener("click", () => toggleSidebar("guest"));
}

function toggleSidebar(prefix) {
  const sidebar = document.getElementById(`${prefix}-sidebar`);
  const isOpen = sidebar?.classList.contains("open");
  sidebar?.classList.toggle("open", !isOpen);
  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) backdrop.classList.toggle("active", !isOpen);
}

function closeSidebar(prefix) {
  const sidebar = document.getElementById(`${prefix}-sidebar`);
  if (sidebar) sidebar.classList.remove("open");
  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) backdrop.classList.remove("active");
}

// ═══════════════════════════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════════════════════════
function openModal(title, bodyHTML) {
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  const overlay = document.getElementById("modal-overlay");
  
  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.innerHTML = bodyHTML;
  if (overlay) overlay.classList.remove("hidden");
}

function closeModal() { 
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.add("hidden"); 
}
window.closeModal = closeModal;

const modalCloseBtn = document.getElementById("modal-close-btn");
if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

const modalOverlay = document.getElementById("modal-overlay");
if (modalOverlay) {
  modalOverlay.addEventListener("click", e => { if(e.target===e.currentTarget) closeModal(); });
}

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
    if (collectionName === "products") return demoData.products || [];
    if (!clientId) return demoData[collectionName] || [];
    const data = demoData[collectionName] || [];
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

  form.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=color]), select, textarea").forEach(el => {
    if (el.name) data[el.name] = el.value;
  });

  const checkNames = new Set([...form.querySelectorAll("input[type=checkbox]")].map(el=>el.name));
  checkNames.forEach(name => {
    data[name] = [...form.querySelectorAll(`input[type=checkbox][name="${name}"]:checked`)].map(el=>el.value);
  });

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
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");
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
  if (!container) return;
  
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
  const map = { 
    requested:"badge-gold", 
    confirmed:"badge-blue", 
    completed:"badge-green", 
    cancelled:"badge-red", 
    pending:"badge-gold", 
    approved:"badge-green", 
    rejected:"badge-red", 
    paid:"badge-green", 
    unpaid:"badge-gold", 
    overdue:"badge-red" 
  };
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

// Make functions available globally for onclick handlers
window.openClientModal = openClientModal;
window.openBriefModal = openBriefModal;
window.openBookingModal = openBookingModal;
window.approveBrief = approveBrief;
window.confirmBooking = confirmBooking;
window.completeBooking = completeBooking;
window.markInvoicePaid = markInvoicePaid;
window.openFeedbackModal = openFeedbackModal;
window.submitFeedback = submitFeedback;
window.openAddDeliverableModal = openAddDeliverableModal;
window.submitDeliverable = submitDeliverable;
window.togglePublic = togglePublic;
window.openCreateInvoiceModal = openCreateInvoiceModal;
window.submitInvoice = submitInvoice;
window.openCreateBookingModal = openCreateBookingModal;
window.submitAdminBooking = submitAdminBooking;
window.openAddProductModal = openAddProductModal;
window.submitProduct = submitProduct;
window.editProduct = editProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.submitInvite = submitInvite;
window.selectCalendarDate = selectCalendarDate;
window.markFeedbackRead = markFeedbackRead;
