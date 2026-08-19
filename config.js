/**
 * Allianz Payment Tracker - Application Configuration
 * Ready for Cloudflare Pages / Static Hosting deployment.
 */
window.APP_CONFIG = {
    // Supabase Credentials (optional - set here if connecting to live Supabase backend)
    SUPABASE_URL: '', 
    SUPABASE_ANON_KEY: '',
    
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
