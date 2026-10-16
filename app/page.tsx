import CameraMark from "@/app/components/CameraMark";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import SignOutButton from "@/app/components/SignOutButton";
import GenerateCaptionForm from "@/app/components/GenerateCaptionForm";


export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className={user ? "page workspace-page" : "page"}>
      <header className="topbar">
        <Link className="wordmark" href="/"><CameraMark className="brand-camera" />caption studio</Link>
        <nav aria-label="Account">{user ? <><Link href="/captions">Saved captions</Link><Link href="/profile">Your profile</Link><SignOutButton /></> : <span className="small-note">A little more you.</span>}</nav>
      </header>
      {!user && <section className="hero">
        <p className="eyebrow">FOR YOUR CAMERA ROLL AND YOUR PERSONALITY</p>
        <h1>Good photos. <em>Better captions.</em></h1>
        <p className="intro">One great photo. A whole weekend of moments.<br />Find three captions for your next post that feel like you.</p>
        <div className="steps"><span>01 / Add your photos</span><span>02 / Set the vibe</span><span>03 / Find your words</span></div>
      </section>}
      {user ? <>
        <GenerateCaptionForm userId={user.id} />

      </> : <section className="welcome-card"><p className="eyebrow">LESS OVERTHINKING. MORE POSTING.</p><h2>Your photos already tell a story.</h2><p>Give them a caption to match. Sign in, add one photo or a whole dump, and choose your vibe.</p><GoogleLoginButton /><div className="sample-caption"><span className="eyebrow">EXAMPLE · CASUAL</span><p>camera roll made it out of drafts</p></div></section>}
      <footer>Caption Studio ♡ <span>Made for the moments worth sharing.</span></footer>
    </main>
  );
}
