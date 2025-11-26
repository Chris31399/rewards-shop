// ========================
// SUPABASE CLIENT
// ========================
const SUPABASE_URL = "https://jllbfimaqxenasoycjjw.supabase.co/";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbGJmaW1hcXhlbmFzb3ljamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODY4NzQsImV4cCI6MjA3OTE2Mjg3NH0.HKDLCnnTE9b__BHog0lk9PBy7FoxrZz6wPt4bihgdk0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================
// TEST CONNECTION
// ========================
async function testConnection() {
  const { data, error } = await supabaseClient.from("roles").select("*");
  if (error) console.error("Connection failed:", error);
  else console.log("Connection successful! Roles table:", data);
}

// ========================
// SIGNUP
// ========================
async function handleSignup(email, password) {
  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (authError) {
    alert("Signup failed: " + authError.message);
    return;
  }

  const user = authData.user;

  const { error: profileError } = await supabaseClient.from("profiles").insert({
    id: user.id,
    email: user.email,
    role_id: 3, // default = customer
    points: 0,
  });

  if (profileError) {
    alert("Profile creation error: " + profileError.message);
    return;
  }

  alert("Successfully created an account! Please log in.");
  window.location.href = "login.html";
}

// Signup event listener
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      handleSignup(email, password);
    });
  }
});

// ========================
// LOGIN
// ========================
async function handleLogin(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  window.location.href = "dashboard.html";
}

// Login event listener
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      handleLogin(email, password);
    });
  }
});

// ========================
// DASHBOARD - Load Profile
// ========================
async function loadProfile() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("email, points, roles(name)")
    .eq("id", user.id)
    .single();

  const profileContainer = document.getElementById("profile");
  if (profileContainer) {
    profileContainer.innerHTML = `
        <p>Email: ${profile.email}</p>
        <p>Role: ${profile.roles.name}</p>
        <p>Points: ${profile.points}</p>
    `;
  }
}

// ========================
// DASHBOARD - Logout Button
// ========================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile")) {
    loadProfile();
    loadRewards(); // Load rewards dynamically when dashboard loads
  }

  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    };
  }
});

// ========================
// DASHBOARD - Load Rewards
// ========================
async function loadRewards() {
  const container = document.querySelector(".product-grid");
  if (!container) return;

  container.innerHTML = `<p>Loading rewards...</p>`;

  // Fetch rewards
  const { data: rewards, error } = await supabaseClient
    .from("rewards")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    container.innerHTML = `<p>Error loading rewards.</p>`;
    console.error(error);
    return;
  }

  // Fetch reward_tags + tags
  const { data: rewardTags, error: tagsError } = await supabaseClient
    .from("reward_tags")
    .select("reward_id, tag_name");

  if (tagsError) {
    console.error(tagsError);
  }

  // Map reward_id → array of tag names
  const tagMap = {};
  rewardTags?.forEach(rt => {
    if (!tagMap[rt.reward_id]) tagMap[rt.reward_id] = [];
    tagMap[rt.reward_id].push(rt.tag_name);
  });

  // Build the product grid
  container.innerHTML = ""; // clear placeholder boxes

  rewards.forEach(reward => {
    const tags = tagMap[reward.id] || [];

    const card = document.createElement("div");
    card.className = "product-placeholder"; // reuse existing style
    card.innerHTML = `
        <img src="${reward.image_url || "placeholder.jpg"}" class="reward-image" style="width:100%;height:120px;object-fit:cover;border-radius:6px;">
        <h3 style="margin:8px 0 4px;">${reward.name}</h3>
        <p style="margin:0 0 4px;">Cost: ${reward.cost} pts</p>
        <p style="font-size:12px;color:#ccc;">${reward.description}</p>
        <div style="margin-top:4px;">
            ${tags.map(t => `<span class="tag" style="padding:2px 6px;background:rgba(255,255,255,0.2);border-radius:4px;font-size:10px;margin-right:4px;">${t}</span>`).join("")}
        </div>
    `;

    container.appendChild(card);
  });

  if (rewards.length === 0) {
    container.innerHTML = `<p>No rewards available.</p>`;
  }
}

testConnection();
