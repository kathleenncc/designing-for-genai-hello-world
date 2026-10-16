import CameraMark from "@/app/components/CameraMark";
import Link from "next/link";
import { redirect } from "next/navigation";
import { captionSummary } from "@/utils/caption-prompt";
import { createClient } from "@/utils/supabase/server";
import VoteButtons from "@/app/components/VoteButtons";
import SignOutButton from "@/app/components/SignOutButton";
type Generation = { id: number; prompt: string; generated_text: string; votes: { vote: number; user_id: string }[] };
export default async function Captions({ searchParams }: { searchParams: Promise<{ view?: string; page?: string }> }) {
 const params = await searchParams;
 const recent = params.view === "recent";
 const page = Math.min(100000, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/");
  let query = supabase.from("generations").select(recent ? "id, prompt, generated_text, votes(vote, user_id)" : "id, prompt, generated_text, votes!inner(vote, user_id)", { count: "exact" }).eq("user_id", user.id).like("prompt", "[Caption Studio]%");
  if (!recent) query = query.eq("votes.user_id", user.id).eq("votes.vote", 1);
  const { data, error, count } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(recent ? 0 : (page - 1) * 30, recent ? 29 : page * 30 - 1);
  const generations = (data ?? []) as Generation[];
return <main className="page"><header className="topbar"><Link className="wordmark" href="/"><CameraMark className="brand-camera" />caption studio</Link><nav aria-label="Account"><Link href="/">Create captions</Link><Link href="/profile">Your profile</Link><SignOutButton /></nav></header>        <section className="history" aria-labelledby="history-heading">
          <div className="section-heading"><div><p className="eyebrow">YOUR WORDS, COLLECTED</p><h2 id="history-heading">{recent ? "Recent captions" : "My favorites"}</h2></div><span className="small-note">{recent ? "Your latest 30 captions. Come back and rate them anytime." : "The captions that sound like you."}</span></div>
          <nav className="collection-tabs" aria-label="Caption collections"><Link href="/captions" aria-current={!recent ? "page" : undefined}>♡ My favorites</Link><Link href="/captions?view=recent" aria-current={recent ? "page" : undefined}>Recent</Link></nav>
          {error ? <p role="alert">We couldn’t load your saved captions. Try refreshing.</p> : generations.length ? <div className="caption-grid">{generations.map(generation => {
            const votes = generation.votes ?? [];
            return <article className="caption-card" key={generation.id}>
              <p className="eyebrow">{captionSummary(generation.prompt)}</p>
              <p className="caption-text">{generation.generated_text}</p>
              <VoteButtons generationId={generation.id} userId={user.id} initialVote={votes.find(v => v.user_id === user.id)?.vote ?? 0} />
            </article>;
          })}</div> : <div className="empty-state">{recent ? "Your history starts with your first captions." : "No favorites here yet. Tap ♡ Save · sounds like me on any caption to keep it here."} <Link href={recent ? "/" : "/captions?view=recent"}>{recent ? "Create captions" : "Browse recent captions"}</Link></div>}
          {!recent && !error && <nav className="collection-pagination" aria-label="Favorites pages">{page > 1 && <Link href={`/captions?page=${page - 1}`}>← Previous</Link>}{(count ?? 0) > page * 30 && <Link href={`/captions?page=${page + 1}`}>More favorites →</Link>}</nav>}
        </section></main>;
}
