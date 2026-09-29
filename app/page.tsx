import { supabase } from "@/utils/supabase/client";

export default async function Home() {
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
            // Skip this template because its image URL is broken
            if (meme.meme_label === "Mocking Spongebob") {
                return false;
            }

            // Skip templates we have already displayed
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
                a collection of meme captions from the ImgFlip dataset.
            </p>

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