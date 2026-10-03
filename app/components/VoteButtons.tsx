"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";

type VoteButtonsProps = {
    generationId: number;
    userId: string;
};

export default function VoteButtons({
                                        generationId,
                                        userId,
                                    }: VoteButtonsProps) {
    const [message, setMessage] = useState("");

    const submitVote = async (vote: number) => {
        const { error } = await supabase
            .from("votes")
            .upsert(
                {
                    user_id: userId,
                    generation_id: generationId,
                    vote,
                },
                {
                    onConflict: "user_id,generation_id",
                }
            );

        if (error) {
            console.error("Vote error:", error);
            setMessage("Could not save vote.");
            return;
        }

        setMessage(vote === 1 ? "Upvoted!" : "Downvoted!");
    };

    return (
        <div>
            <button onClick={() => submitVote(1)}>
                👍 Upvote
            </button>

            <button onClick={() => submitVote(-1)}>
                👎 Downvote
            </button>

            {message && <p>{message}</p>}
        </div>
    );
}