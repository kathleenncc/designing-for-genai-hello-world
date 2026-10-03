"use client";

import { supabase } from "@/utils/supabase/client";

export default function GoogleLoginButton() {
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error("Google login error:", error.message);
        }
    };

    return (
        <button onClick={handleGoogleLogin}>
            Sign in with Google
        </button>
    );
}