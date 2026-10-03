import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/app/components/ProfileForm";
import Link from "next/link";

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
            <h1>Your Profile</h1>

            <p>
                Signed in as: {user.email}
            </p>

            <ProfileForm
                userId={user.id}
                firstName={profile?.first_name ?? null}
                lastName={profile?.last_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
            />

            <br />

            <Link href="/">Back to Memes</Link>
        </main>
    );
}