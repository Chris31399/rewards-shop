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

    // 3. Redirect
    window.location.href = "dashboard.html";
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

testConnection();
