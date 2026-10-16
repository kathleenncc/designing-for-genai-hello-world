"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";

export default function VoteButtons({ generationId, userId, initialVote = 0 }: { generationId: number; userId: string; initialVote?: number }) {
  const router = useRouter();
  const [selection, setSelection] = useState({ base: initialVote, value: initialVote });
  const selectedVote = selection.base === initialVote ? selection.value : initialVote;
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submitVote(vote: number) {
    const removing = selectedVote === vote;
    setSaving(true);
    setMessage("");
    try {
      const { error } = removing
        ? await supabase.from("votes").delete().eq("user_id", userId).eq("generation_id", generationId)
        : await supabase.from("votes").upsert({ user_id: userId, generation_id: generationId, vote }, { onConflict: "user_id,generation_id" });
      if (error) throw error;
      setSelection({ base: initialVote, value: removing ? 0 : vote });
      setMessage(removing ? "Rating removed. Caption stays in your history." : vote === 1 ? "Saved to My favorites." : "Feedback saved. Caption stays in your history.");
      router.refresh();
    } catch { setMessage("Couldn’t save your vote. Try again."); }
    finally { setSaving(false); }
  }
  return <div><div className="vote-buttons"><button type="button" disabled={saving} aria-pressed={selectedVote === 1} onClick={() => submitVote(1)} title={selectedVote === 1 ? "Remove from favorites" : "Save to favorites"}>{selectedVote === 1 ? "♥ Saved · sounds like me" : "♡ Save · sounds like me"}</button><button type="button" disabled={saving} aria-pressed={selectedVote === -1} onClick={() => submitVote(-1)}>↓ Not my vibe</button></div><p className="small-note" role="status">{message}</p></div>;
}
