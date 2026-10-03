"use client";

import { supabase } from "@/utils/supabase/client";

export default function SignOutButton() {
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    return (
        <button onClick={handleSignOut}>
            Sign out
        </button>
    );
}