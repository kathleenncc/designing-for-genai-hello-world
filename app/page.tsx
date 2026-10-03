import { createClient } from "@/utils/supabase/server";
import GoogleLoginButton from "@/app/components/GoogleLoginButton";
import SignOutButton from "@/app/components/SignOutButton";
import GenerateCaptionForm from "@/app/components/GenerateCaptionForm";
import VoteButtons from "@/app/components/VoteButtons";
import Link from "next/link";

export default async function Home() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <main className="page">
                <h1>Meme Captions</h1>

                <p className="intro">
                    Sign in with Google to view, create, and rate AI-generated meme captions.
                </p>

                <GoogleLoginButton />
            </main>
        );
    }

    const { data: generations, error: generationsError } = await supabase
        .from("generations")
        .select(`
      *,
      votes (
        vote
      )
    `)
        .order("created_at", { ascending: false });

    if (generationsError) {
        console.error("Generations error:", generationsError);
    }

    const { data: allMemes, error } = await supabase
        .from("meme_captions")
        .select("*")
        .order("id");

    if (error) {
        console.error("Supabase error:", error);
        return <main>Could not load meme captions.</main>;
    }

    const seenTemplates = new Set<string>();

    const memes = allMemes
        .filter((meme: any) => {
            if (meme.meme_label === "Mocking Spongebob") {
                return false;
            }

            if (seenTemplates.has(meme.meme_label)) {
                return false;
            }

            seenTemplates.add(meme.meme_label);
            return true;
        })
        .slice(0, 10);

    return (
        <main className="page">
            <h1>Meme Captions</h1>

            <p className="intro">
                Generate, discover, and rate AI meme captions inspired by college life and New York City.

            </p>

            <GenerateCaptionForm />

            <br />

            <Link href="/profile">Profile</Link>

            <br />
            <br />

            <SignOutButton />

            <hr />

            <h2>Rate the Latest AI Captions</h2>

            {generations && generations.length > 0 ? (
                <div>
                    {generations.map((generation: any) => {
                        const upvotes =
                            generation.votes?.filter((vote: any) => vote.vote === 1).length ?? 0;

                        const downvotes =
                            generation.votes?.filter((vote: any) => vote.vote === -1).length ?? 0;

                        const score = upvotes - downvotes;

                        return (
                            <div key={generation.id}>
                                <p>
                                    <strong>Prompt:</strong> {generation.prompt}
                                </p>

                                <p>
                                    <strong>AI Caption:</strong> {generation.generated_text}
                                </p>

                                <p>
                                    👍 {upvotes} &nbsp; 👎 {downvotes} &nbsp; Score: {score}
                                </p>

                                <VoteButtons
                                    generationId={generation.id}
                                    userId={user.id}
                                />

                                <hr />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p>No AI-generated captions yet.</p>
            )}

            <h2>Dataset Meme Captions</h2>

            <div className="meme-list">
                {memes.map((meme: any) => (
                    <div className="meme-card" key={meme.id}>
                        <h2>{meme.meme_label}</h2>

                        <p>{meme.caption_text}</p>

                        <img
                            src={meme.image_url}
                            alt={meme.meme_label}
                        />
                    </div>
                ))}
            </div>

            <footer>
                Data sourced from the ImgFlip Scraped Memes Caption Dataset on Kaggle.
            </footer>
        </main>
    );
}