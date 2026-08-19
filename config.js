/**
 * Allianz Payment Tracker - Application Configuration
 * Ready for Cloudflare Pages / Static Hosting deployment.
 */
window.APP_CONFIG = {
    // Supabase Credentials (optional - set here if connecting to live Supabase backend)
    SUPABASE_URL: 'https://poldblmdcdwujtqrgxnt.supabase.co', 
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbGRibG1kY2R3dWp0cXJneG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDI2NjEsImV4cCI6MjEwMjY3ODY2MX0.kflpmeNTRzWbyjFUuOea1EbxdIUfSl0lcTJwFvBPzwQ',
    
    // Access PIN
    DEFAULT_PIN: '0420',
    
    // Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'allianz_auth_session',
        CUSTOM_PIN: 'allianz_custom_pin',
        THEME: 'allianz_theme_preference',
        DEMO_STUDENTS: 'allianz_demo_students'
    }
};
