// ======================================================
// GLOBAL STATE VARIABLES
// ======================================================
let allRewards = [];
let allRewardTags = [];
let activeFilters = [];
let searchQuery = "";
let sortMode = "";

// ======================================================
// SUPABASE CLIENT
// ======================================================
const SUPABASE_URL = "https://jllbfimaqxenasoycjjw.supabase.co/";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbGJmaW1hcXhlbmFzb3ljamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODY4NzQsImV4cCI6MjA3OTE2Mjg3NH0.HKDLCnnTE9b__BHog0lk9PBy7FoxrZz6wPt4bihgdk0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======================================================
// TEST CONNECTION
// ======================================================
async function testConnection() {
  const { data, error } = await supabaseClient.from("roles").select("*");
  if (error) console.error("Connection failed:", error);
  else console.log("Connection successful! Roles table:", data);
}

// ======================================================
// SIGNUP
// ======================================================
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

// Signup listener
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSignup(
        document.getElementById("email").value,
        document.getElementById("password").value
      );
    });
  }
});

async function registerAdminOrEmployee(email, password, roleId) {
  // Confirmation popup
  const confirmMsg = roleId === 1 
    ? "Are you sure you want to create an ADMIN account?" 
    : "Are you sure you want to create an EMPLOYEE account?";

  if (!confirm(confirmMsg)) return;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (authError) {
    alert("Signup failed: " + authError.message);
    return;
  }

  const user = authData.user;

  // 2. Insert profile with specified role
  const { error: profileError } = await supabaseClient.from("profiles").insert({
    id: user.id,
    email: user.email,
    role_id: roleId, 
    points: 0,
  });

  if (profileError) {
    alert("Profile creation error: " + profileError.message);
    return;
  }

  alert(
    roleId === 1 
      ? "Admin account created successfully!" 
      : "Employee account created successfully!"
  );
}

// ======================================================
// LOGIN
// ======================================================
async function handleLogin(email, password) {
  // 1. Sign in
  const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    alert("Login failed: " + authError.message);
    return;
  }

  // 2. Get current user
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("Could not retrieve user info.");
    return;
  }

  // 3. Get profile including role
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    alert("Profile not found or error: " + (profileError?.message || ""));
    return;
  }

  // 4. Redirect based on role_id
  switch (profile.role_id) {
    case 1: // Admin
      window.location.href = "adminDashboard.html";
      break;
    case 2: // Employee (not implemented yet)
      window.location.href = "employeeDashboard.html"; 
      break;
    case 3: // Customer
      window.location.href = "dashboard.html";
      break;
    default:
      alert("Role not found. Please contact support.");
      break;
  }
}

// Login listener
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLogin(
        document.getElementById("login-email").value,
        document.getElementById("login-password").value
      );
    });
  }
});

// ======================================================
// LOAD PROFILE (Dashboard)
// ======================================================
async function loadProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();

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

// ======================================================
// INITIALIZE DASHBOARD
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("profile")) {
    loadProfile();
    loadRewards();
  }

  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "login.html";
    };
  }
});

// ======================================================
// LOAD REWARDS (fetches only — rendering handled by renderRewards())
// ======================================================
async function loadRewards() {
  const container = document.getElementById("rewards-container");
  if (!container) return;

  container.innerHTML = `<p>Loading rewards...</p>`;

  // Fetch rewards
  const { data: rewards, error } = await supabaseClient
    .from("rewards")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    container.innerHTML = `<p>Error loading rewards.</p>`;
    return;
  }

  // Fetch tags
  const { data: rewardTags, error: tagsError } = await supabaseClient
    .from("reward_tags")
    .select("reward_id, tag_name");

  if (tagsError) console.error(tagsError);

  // Save globally
  allRewards = rewards;
  allRewardTags = rewardTags;

  // Render
  renderRewards();
}

// ======================================================
// RENDER REWARDS
// ======================================================
function renderRewards() {
  const container = document.getElementById("rewards-container");
  container.innerHTML = "";

  let filtered = [...allRewards];

  // SEARCH
  if (searchQuery.trim() !== "") {
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // FILTER BY TAGS
  if (activeFilters.length > 0) {
    const tagMap = {};
    allRewardTags.forEach(t => {
      if (!tagMap[t.reward_id]) tagMap[t.reward_id] = [];
      tagMap[t.reward_id].push(t.tag_name);
    });

    filtered = filtered.filter(r =>
      activeFilters.every(tag => tagMap[r.id]?.includes(tag))
    );
  }

  // SORT
  switch (sortMode) {
    case "low-to-high": filtered.sort((a, b) => a.cost - b.cost); break;
    case "high-to-low": filtered.sort((a, b) => b.cost - a.cost); break;
    case "name-asc": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "name-desc": filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
  }

  // EMPTY RESULT
  if (filtered.length === 0) {
    container.innerHTML = `<p>No rewards match your filters.</p>`;
    return;
  }

  // RENDER CARDS
  filtered.forEach(reward => {
    const rewardTagNames = allRewardTags
      .filter(t => t.reward_id === reward.id)
      .map(t => t.tag_name);

    const card = document.createElement("div");
    card.className = "reward-card";

    card.innerHTML = `
      <span class="wishlist-heart heart-empty" data-id="${reward.id}">♡</span>
      <img src="${reward.image_url || "placeholder.jpg"}" class="reward-image">
      <h3>${reward.name}</h3>
      <p class="reward-cost">${reward.cost} pts</p>
      <p class="reward-description">${reward.description}</p>
      <div class="reward-tags">
        ${rewardTagNames.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
    `;

    container.appendChild(card);

    // WISHLIST ICON CLICK HANDLER
    const heart = card.querySelector(".wishlist-heart");
    if (heart) {
      heart.addEventListener("click", (e) => {
          const heartElement = e.target;
          toggleWishlist(reward.id, heartElement); // NEW FUNCTION CALL
      });
    }
// End of renderRewards()
  });
}

// ======================================================
// TOGGLE WISHLIST FUNCTION
// ======================================================

async function toggleWishlist(rewardId, heartElement) {
  // Get current user
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  // Check current state
  const isAdding = heartElement.classList.contains("heart-empty");

  if (isAdding) {
    // Add to wishlist
    const { error } = await supabaseClient.from("wishlist").insert({
      profile_id: user.id,
      reward_id: rewardId
    });

    if (error) {
      console.error("Failed to add to wishlist:", error);
      return;
    }

    heartElement.classList.remove("heart-empty");
    heartElement.classList.add("heart-filled");
    heartElement.textContent = "❤️";
  } else {
    // Remove from wishlist
    const { error } = await supabaseClient.from("wishlist")
      .delete()
      .eq("profile_id", user.id)
      .eq("reward_id", rewardId);

    if (error) {
      console.error("Failed to remove from wishlist:", error);
      return;
    }

    heartElement.classList.remove("heart-filled");
    heartElement.classList.add("heart-empty");
    heartElement.textContent = "♡";
  }
}
// ======================================================
// Admin Dashboard
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  // If on the Products tab for admin dashboard
  if (document.getElementById("product-table")) {
    loadProducts();
  }
  // --- Employee Registration ---
  const employeeForm = document.getElementById("employee-reg-form");
  if (employeeForm) {
    employeeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("employee-email").value;
      const password = document.getElementById("employee-password").value;
      registerAdminOrEmployee(email, password, 2); // role_id = 2 for employee
    });
  }
  // --- Admin Registration ---
  const adminForm = document.getElementById("admin-reg-form");
  if (adminForm) {
    adminForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("admin-email").value;
      const password = document.getElementById("admin-password").value;
      registerAdminOrEmployee(email, password, 1); // role_id = 1 for admin
    });
  }
});

async function loadProducts() {
  const { data: products, error } = await supabaseClient
    .from("rewards")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Error loading products:", error);
    return;
  }

  renderProductTable(products);
}

function renderProductTable(products) {
  const tbody = document.querySelector("#product-table tbody");
  tbody.innerHTML = "";

  products.forEach(p => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><img src="${p.image_url}" class="product-thumb"></td>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.cost}</td>
      <td>${p.description}</td>
      <td class="actions-cell">
        <span class="action-icon edit-icon" data-id="${p.id}">✏️</span>
        <span class="action-icon delete-icon" data-id="${p.id}">🗑️</span>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Wire up edit/delete events
  document.querySelectorAll(".edit-icon").forEach(icon => {
  icon.addEventListener("click", async () => {
    const id = icon.dataset.id;

    const { data, error } = await supabaseClient
      .from("rewards")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      alert("Error fetching product: " + error.message);
      return;
    }

    // Fill modal inputs
    document.getElementById("edit-id").value = data.id;
    document.getElementById("edit-name").value = data.name;
    document.getElementById("edit-cost").value = data.cost;
    document.getElementById("edit-description").value = data.description;
    document.getElementById("edit-image").value = data.image_url;

    // Show modal
    document.getElementById("edit-modal").classList.remove("hidden");
  });
});

  document.querySelectorAll(".delete-icon").forEach(icon => {
    icon.addEventListener("click", async () => {
      const id = icon.dataset.id;
  
      if (!confirm("Are you sure you want to delete product ID " + id + "?")) {
        return;
      }
  
      const { error } = await supabaseClient
        .from("rewards")
        .delete()
        .eq("id", id);
  
      if (error) {
        alert("Error deleting product: " + error.message);
        return;
      }
  
      alert("Product deleted!");
      loadProducts(); // Refresh table
    });
  });
}

// ADD PRODUCT HANDLERS
// Add Product - Save Button
document.getElementById("save-add-btn")?.addEventListener("click", async () => {
  const name = document.getElementById("add-name").value.trim();
  const cost = parseInt(document.getElementById("add-cost").value);
  const description = document.getElementById("add-description").value.trim();
  const image = document.getElementById("add-image").value.trim();

  if (!name || !cost || !description) {
    alert("Please fill in all required fields.");
    return;
  }

  const { error } = await supabaseClient.from("rewards").insert({
    name,
    cost,
    description,
    image_url: image
  });

  if (error) {
    alert("Error adding product: " + error.message);
    return;
  }

  alert("Product added successfully!");

  document.getElementById("add-modal").classList.add("hidden");

  loadProducts(); // Refresh table
});

// Add Product - Cancel Button
document.getElementById("cancel-add-btn")?.addEventListener("click", () => {
  document.getElementById("add-modal").classList.add("hidden");
});




// ======================================================
// SEARCH
// ======================================================
document.getElementById("search-input")?.addEventListener("input", e => {
  searchQuery = e.target.value;
  renderRewards();
});

// ======================================================
// SORT
// ======================================================
document.getElementById("sort-select")?.addEventListener("change", e => {
  sortMode = e.target.value;
  renderRewards();
});

// ======================================================
// FILTER MODAL
// ======================================================
document.getElementById("filter-btn")?.addEventListener("click", () => {
  const modal = document.getElementById("filter-modal");
  const list = document.getElementById("filter-tag-list");

  const tags = [...new Set(allRewardTags.map(t => t.tag_name))];

  list.innerHTML = tags
    .map(tag => `
      <label class="filter-tag-checkbox">
        <input type="checkbox" value="${tag}">
        ${tag}
      </label>
    `)
    .join("");

  modal.classList.remove("hidden");
});

// APPLY FILTER
document.getElementById("apply-filter")?.addEventListener("click", () => {
  const checked = [...document.querySelectorAll(".filter-tag-checkbox input:checked")];
  activeFilters = checked.map(c => c.value);

  document.getElementById("filter-modal").classList.add("hidden");
  renderRewards();
});

// CLOSE FILTER
document.getElementById("close-filter")?.addEventListener("click", () => {
  document.getElementById("filter-modal").classList.add("hidden");
});

// CLOSE EDIT MODAL
document.getElementById("cancel-edit-btn").addEventListener("click", () => {
  document.getElementById("edit-modal").classList.add("hidden");
});

// SAVE EDIT CHANGES
document.getElementById("save-edit-btn").addEventListener("click", async () => {
  const id = document.getElementById("edit-id").value;
  const name = document.getElementById("edit-name").value;
  const cost = document.getElementById("edit-cost").value;
  const description = document.getElementById("edit-description").value;
  const image_url = document.getElementById("edit-image").value;

  const { error } = await supabaseClient
    .from("rewards")
    .update({
      name,
      cost,
      description,
      image_url
    })
    .eq("id", id);

  if (error) {
    alert("Update failed: " + error.message);
    return;
  }

  document.getElementById("edit-modal").classList.add("hidden");

  // Reload table
  loadProducts();
});

// RUN CONNECTION TEST
testConnection();
