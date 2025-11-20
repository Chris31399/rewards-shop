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

testConnection();
