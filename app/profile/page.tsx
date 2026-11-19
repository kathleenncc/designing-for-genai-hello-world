import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/app/components/ProfileForm";
import Link from "next/link";
import CameraMark from "@/app/components/CameraMark";
import SignOutButton from "@/app/components/SignOutButton";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single();

    return (
        <main className="page">
            <header className="topbar"><Link className="wordmark" href="/"><CameraMark className="brand-camera" />caption studio</Link><nav aria-label="Account"><Link href="/">Create captions</Link><Link href="/captions">Saved captions</Link><SignOutButton /></nav></header>
            <p className="eyebrow">Account</p>
            <h1>Your <em>profile.</em></h1>

            <p className="small-note">Signed in as {user.email}</p>

            <ProfileForm
                userId={user.id}
                firstName={profile?.first_name ?? null}
                lastName={profile?.last_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
            />

            <br />

            <Link href="/">Back to Caption Studio</Link>
        </main>
    );
}