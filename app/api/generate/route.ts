import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: "You must be signed in." },
            { status: 401 }
        );
    }

    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
        return NextResponse.json(
            { error: "Please enter a prompt." },
            { status: 400 }
        );
    }

    const geminiResponse = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": process.env.GEMINI_API_KEY!,
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `
Create one short, funny meme caption based on this idea:

"${prompt}"

Audience:
A chronically-online college student in New York City.

Keep it concise, casual, and meme-friendly.
Return only the caption.
                `.trim(),
                            },
                        ],
                    },
                ],
            }),
        }
    );

    if (!geminiResponse.ok) {
        const details = await geminiResponse.text();

        console.error("Gemini error:", details);

        return NextResponse.json(
            {
                error: "AI generation failed.",
            },
            { status: 500 }
        );
    }

    const result = await geminiResponse.json();

    const generatedText =
        result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!generatedText) {
        console.error("Gemini returned no caption:", result);

        return NextResponse.json(
            { error: "No caption was generated." },
            { status: 500 }
        );
    }

    const { data: generation, error } = await supabase
        .from("generations")
        .insert({
            user_id: user.id,
            prompt: prompt.trim(),
            generated_text: generatedText,
        })
        .select()
        .single();

    if (error) {
        console.error("Supabase insert error:", error);

        return NextResponse.json(
            {
                error: "Caption was generated but could not be saved.",
            },
            { status: 500 }
        );
    }

    return NextResponse.json({
        generation,
    });
}