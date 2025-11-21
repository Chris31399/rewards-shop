// ========================
// SIGN UP
// ========================
const signupForm = document.getElementById("signup-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Grab user input
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // 2. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        alert("Signup error: " + authError.message);
        return;
      }

      console.log("auth session:", supabase.auth.session());
      console.log("user id to insert:", authData.user.id);
      
      // 3. Create profile row in users table
      const { error: profileError } = await supabase
        .from("users") // rename from 'profiles' to 'users' if you changed it
        .insert([
          {
            id: authData.user.id, // PK matches auth UID
            email: email,         // required column
            role_id: 3,           // default to customer
            points: 0             // optional, default is 0
          }
        ]);

      if (profileError) {
        alert("Profile creation error: " + profileError.message);
        return;
      }
      // 4. Success
      alert("Signup complete! Please log in.");
      window.location.href = "login.html";

    } catch (err) {
      console.error("Unexpected error during signup:", err);
      alert("An unexpected error occurred. Check console.");
    }
  });
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
