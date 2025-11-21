const SUPABASE_URL = "https://jllbfimaqxenasoycjjw.supabase.co/";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbGJmaW1hcXhlbmFzb3ljamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODY4NzQsImV4cCI6MjA3OTE2Mjg3NH0.HKDLCnnTE9b__BHog0lk9PBy7FoxrZz6wPt4bihgdk0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    const { data, error } = await supabaseClient.from('roles').select('*');

    if (error) {
        console.error("Connection failed:", error);
    } else {
        console.log("Connection successful! Roles table:", data);
    }
}

async function handleSignup(email, password) {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (authError) {
        alert("Signup failed: " + authError.message);
        return;
    }

    const user = authData.user;

    // 2. Insert into profiles table
    const { error: profileError } = await supabaseClient.from('profiles').insert({
        id: user.id,
        email: user.email,
        role_id: 3, // default = customer
        points: 0
    });

    if (profileError) {
        alert("Profile creation error: " + profileError.message);
        return;
    }

    // 3. Success message
    alert("Successfully created an account! Please log in.");

    // 4. Redirect to login page
    window.location.href = "login.html";
}

// Only runs on signup page
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

async function handleLogin(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }

    window.location.href = "dashboard.html";
}

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

    document.getElementById("profile").innerHTML = `
        <p>Email: ${profile.email}</p>
        <p>Role: ${profile.roles.name}</p>
        <p>Points: ${profile.points}</p>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("profile")) {
        loadProfile();
    }

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await supabaseClient.auth.signOut();
            window.location.href = "login.html";
        };
    }
});

testConnection();
