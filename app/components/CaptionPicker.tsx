"use client";
import { useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { usePickerSession, setPickerSession } from "@/utils/picker-session";
import { supabase } from "@/utils/supabase/client";

export default function CaptionPicker({ userId }: { userId: string }) {
 const session = usePickerSession();
 const [index, setIndex] = useState(0);
 const [photo, setPhoto] = useState(0);
 const [votes, setVotes] = useState<Record<number, number>>({});
 const [busy, setBusy] = useState(false);
 const lock = useRef(false);
 const [message, setMessage] = useState("");
 const touch = useRef<{ x: number; y: number } | null>(null);
 const heading = useRef<HTMLHeadingElement>(null);
 if (!session || session.userId !== userId) return <section className="picker-empty"><h1>Start with your moments.</h1><p>This photo preview is available after generating captions in this tab. Refreshing clears the photos, but your captions are safe in Recent.</p><Link href="/">Create captions →</Link><Link href="/captions?view=recent">Open Recent</Link></section>;
 const batch = session;
 const current = batch.captions[index];
 const favorites = batch.captions.filter(item => votes[item.id] === 1);
 function advance() { setIndex(value => value + 1); heading.current?.focus(); }
 async function rate(vote: number) {
  if (!current || lock.current) return;
  lock.current = true; setBusy(true); setMessage("");
  try {
   const { error } = await supabase.from("votes").upsert({ user_id: userId, generation_id: current.id, vote }, { onConflict: "user_id,generation_id" });
   if (error) throw error;
   setVotes(previous => ({ ...previous, [current.id]: vote }));
   setMessage(vote === 1 ? "Saved to My favorites." : "Feedback saved."); advance();
  } catch { setMessage("Couldn’t save that rating. Please try again—your caption is still here."); }
  finally { lock.current = false; setBusy(false); }
 }
 function swipe(event: TouchEvent<HTMLElement>) {
  const start = touch.current; touch.current = null;
  const end = event.changedTouches[0];
  if (!start || !end || busy) return;
  const dx = end.clientX - start.x, dy = end.clientY - start.y;
  if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.8) void rate(dx > 0 ? 1 : -1);
 }
 async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); setMessage("Copied—ready for your post."); }
  catch { setMessage("Select the caption text to copy it manually."); }
 }
 async function retry() {
  if (lock.current) return;
  lock.current = true; setBusy(true); setMessage("");
  try {
   const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: batch.photos.map(item => item.data), vibe: batch.vibe, length: batch.length, context: batch.context, examples: batch.examples }) });
   const data = await response.json();
   if (!response.ok) throw new Error(data.error || "Couldn’t generate another set.");
   setPickerSession({ ...batch, captions: data.generations }); setVotes({}); setIndex(0); heading.current?.focus();
  } catch (error) { setMessage(error instanceof Error ? error.message : "Connection interrupted. Try again."); }
  finally { lock.current = false; setBusy(false); }
 }
 return <section className="picker-shell">
  <div className="picker-intro"><p className="eyebrow">YOUR PHOTOS. YOUR WORDS.</p><h1 ref={heading} tabIndex={-1}>{current ? "Would you post this?" : "Your picks, ready to post."}</h1><p className="small-note">{current ? `Caption ${index + 1} of ${batch.captions.length} · ${batch.vibe} · One caption for your whole post` : "Every option is in Recent, including the ones you skipped."}</p></div>
  <div className="picker-layout"><div className="picker-photos">
   {/* Resized, in-memory user image; never a remote image request. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={batch.photos[photo].data} alt={`Your post, photo ${photo + 1} of ${batch.photos.length}`} />
   <div className="photo-navigation"><button type="button" disabled={photo === 0} onClick={() => setPhoto(value => value - 1)} aria-label="Previous photo">←</button><span aria-live="polite">{photo + 1} / {batch.photos.length}</span><button type="button" disabled={photo === batch.photos.length - 1} onClick={() => setPhoto(value => value + 1)} aria-label="Next photo">→</button></div>
  </div>
  <div className="picker-review">{current ? <>
   <article className="swipe-caption" onTouchStart={event => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; }} onTouchEnd={swipe} onTouchCancel={() => { touch.current = null; }}><p className="eyebrow">OPTION {String(index + 1).padStart(2, "0")}</p><p className="picker-caption">{current.generated_text}</p></article>
   <div className="picker-actions"><button type="button" disabled={busy} onClick={() => void rate(-1)}>× Not my vibe</button><button type="button" className="save-pick" disabled={busy} onClick={() => void rate(1)}>♡ Save · sounds like me</button></div>
   <div className="picker-secondary"><button type="button" disabled={busy} onClick={() => { setMessage("Skipped without rating. You can revisit it in Recent."); advance(); }}>Next · skip rating →</button><button type="button" onClick={() => void copy(current.generated_text)}>Copy caption</button></div>
   <p className="small-note swipe-hint">On touchscreens, swipe the caption right to save or left for “Not my vibe.”</p>
  </> : <div className="picker-finish"><h2>{favorites.length ? `${favorites.length} favorite${favorites.length === 1 ? "" : "s"}, all yours.` : "Not quite your words yet?"}</h2>{favorites.map(item => <article className="finish-caption" key={item.id}><p>{item.generated_text}</p><button type="button" onClick={() => void copy(item.generated_text)}>Copy caption</button></article>)}<button type="button" disabled={busy} onClick={() => void retry()}>{busy ? "Finding more words…" : "Try another set"}</button><div className="picker-links"><Link href="/captions">My favorites →</Link><Link href="/">Start a new post</Link></div></div>}
   <p className="status" role="status" aria-live="polite">{message}</p>
  </div></div>
 </section>;
}
