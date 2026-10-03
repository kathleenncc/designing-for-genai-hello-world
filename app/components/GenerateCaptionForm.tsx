"use client";

import { useState } from "react";

export default function GenerateCaptionForm() {
    const [prompt, setPrompt] = useState("");
    const [caption, setCaption] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setMessage("Please enter an idea first.");
            return;
        }

        setLoading(true);
        setMessage("");
        setCaption("");

        const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            setMessage(data.error || "Something went wrong.");
            setLoading(false);
            return;
        }

        setCaption(data.generation.generated_text);
        setMessage("Caption generated and saved!");
        setPrompt("");
        setLoading(false);
    };

    return (
        <div>
            <h2>Generate a Meme Caption</h2>

            <p>
                Turn your latest campus, subway, roommate, dining hall, or NYC moment into a meme caption.
            </p>

    <textarea
    value={prompt}
    onChange={(e) => setPrompt(e.target.value)}
    placeholder="Example: waiting 20 minutes for the train and realizing I could have walked to class faster"
    rows={4}
    />

    <br />

    <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Caption"}
        </button>

    {message && <p>{message}</p>}

        {caption && (
            <div>
                <h3>AI Caption</h3>
        <p>{caption}</p>
        </div>
        )}
        </div>
    );
    }