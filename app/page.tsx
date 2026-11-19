import CameraMark from "@/app/components/CameraMark";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import SignOutButton from "@/app/components/SignOutButton";
import GenerateCaptionForm from "@/app/components/GenerateCaptionForm";


export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="login-page">
    <header className="login-header"><span className="login-brand"><CameraMark className="login-logo" />caption studio</span></header>
    <section className="login-hero" aria-labelledby="login-title">
      <div className="login-orb" aria-hidden="true" />
      <h1 id="login-title"><span>Good photos.</span><em>better captions.</em></h1>
      <p className="login-note">Captions written for your photographs, in your own voice.</p>
      <GoogleLoginButton />
    </section>
    <footer className="login-footer"><span>Caption Studio</span><span>Made for the moments worth sharing</span></footer>
  </main>;
  const { data: profile } = await supabase.from("profiles").select("first_name, avatar_url").eq("id", user.id).maybeSingle();
  const handle = (profile?.first_name || user.email?.split("@")[0] || "you").toLowerCase().replace(/[^a-z0-9._]/g, "") || "you";
  return (
    <main className="page workspace-page">
      <header className="topbar">
        <Link className="wordmark" href="/"><CameraMark className="brand-camera" />caption studio</Link>
        <nav aria-label="Account"><Link href="/captions">Saved captions</Link><Link href="/profile">Your profile</Link><SignOutButton /></nav>
      </header>
      <GenerateCaptionForm userId={user.id} handle={handle} avatarUrl={profile?.avatar_url ?? null} />
      <footer>Caption Studio ♡ <span>Made for the moments worth sharing.</span></footer>
    </main>
  );
}
