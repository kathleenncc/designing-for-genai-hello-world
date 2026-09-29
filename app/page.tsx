import { supabase } from "@/utils/supabase/client";

export default async function Home({
                                       searchParams,
                                   }: {
    searchParams: Promise<{ shuffle?: string }>;
}) {
    const params = await searchParams;

    const { data: allMemes, error } = await supabase
        .from("meme_captions")
        .select("*")
        .order("id");

    if (error) {
        console.error("Supabase error:", error);
        return <main>Could not load meme captions.</main>;
    }

    // Keep one caption from each meme template.
    const seenTemplates = new Set<string>();

    const uniqueMemes = allMemes.filter((meme: any) => {
        if (seenTemplates.has(meme.meme_label)) {
            return false;
        }

        seenTemplates.add(meme.meme_label);
        return true;
    });

    // If the user clicks Shuffle, randomize the unique memes.
    if (params.shuffle) {
        uniqueMemes.sort(() => Math.random() - 0.5);
    }

    const memes = uniqueMemes.slice(0, 10);

    return (
        <main className="page">
            <header className="hero">
                <h1>Meme Captions</h1>

                <p>
                    explore captions from popular meme templates,
                    select &quot;view meme&quot; to reveal the image.
                </p>

                <a
                    href={`/?shuffle=${Date.now()}`}
                    className="shuffle-button"
                >
                    Shuffle captions ↻
                </a>
            </header>

            <section className="caption-list">
                {memes.map((meme: any) => (
                    <article className="caption-card" key={meme.id}>
                        <p className="template-name">
                            {meme.meme_label}
                        </p>

                        <p className="caption-text">
                            {meme.caption_text}
                        </p>

                        <details>
                            <summary>View meme</summary>

                            <div className="meme-container">
                                <img
                                    src={meme.image_url}
                                    alt={meme.meme_label}
                                    className="meme-image"
                                />
                            </div>
                        </details>
                    </article>
                ))}
            </section>

            <footer>
                Data sourced from the ImgFlip Scraped Memes Caption Dataset on Kaggle.
            </footer>
        </main>
    );
}