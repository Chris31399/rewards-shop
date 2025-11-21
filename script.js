// ========================
// SIGN UP
// ========================
const signupForm = document.getElementById("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert("Signup error: " + error.message);
    } else {
      alert("Signup successful! Please log in.");
      window.location.href = "login.html";
    }
  });
}

const { data, error } = await supabase.auth.signUp({
  email,
  password
});

// After signup, create the profile row:
if (!error) {
  const { error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id: data.user.id,
        email: email,
        role_id: 3  // customer
      }
    ]);

  if (profileError) {
    alert("Profile creation error: " + profileError.message);
    return;
  }

  alert("Signup complete! Please log in.");
  window.location.href = "login.html";
}


// ========================
// LOGIN
// ========================
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Login error: " + error.message);
    } else {
      alert("Logged in!");
      window.location.href = "dashboard.html";
    }
  });
}

// ========================
// DASHBOARD - CHECK USER
// ========================
const userInfo = document.getElementById("user-info");
if (userInfo) {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      userInfo.textContent = `Logged in as: ${user.email}`;
    } else {
      window.location.href = "login.html";
    }
  });
}

// ========================
// LOGOUT
// ========================
const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}

<!-- redeploy fix -->
