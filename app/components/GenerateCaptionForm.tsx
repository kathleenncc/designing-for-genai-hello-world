"use client";

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import VoteButtons from "./VoteButtons";

const vibes = ["Casual", "Witty", "Chic", "Playful", "Minimal"];
export default function GenerateCaptionForm({ userId }: { userId: string }) {
  const router = useRouter();
  const resultsRef = useRef<HTMLElement>(null);
  const [results, setResults] = useState<{ id: number; generated_text: string }[]>([]);
  const [copyMessage, setCopyMessage] = useState("");
  useEffect(() => {
    if (results.length) {
      resultsRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 900px)").matches) resultsRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    }
  }, [results]);
  async function copyCaption(text: string) {
    try { await navigator.clipboard.writeText(text); setCopyMessage("Caption copied—ready for Instagram."); }
    catch { setCopyMessage("Couldn’t copy automatically. Select the caption text to copy it."); }
  }
  const [photos, setPhotos] = useState<{ id: string; name: string; data: string }[]>([]);
  const [vibe, setVibe] = useState("Casual");
  const [length, setLength] = useState("Short");
  const [context, setContext] = useState("");
  const [examples, setExamples] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState(false);

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setMessage("");
    if (photos.length + files.length > 10) {
      setMessage("Choose up to 10 photos in total. Your current photos are still selected.");
      return;
    }
    if (files.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setMessage("Choose JPG, PNG, or WebP photos, each under 10 MB. Your current photos are still selected.");
      return;
    }
    setReading(true);
    try {
      const additions: { id: string; name: string; data: string }[] = [];
      for (const file of files) {
        const bitmap = await createImageBitmap(file);
        try {
          const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(bitmap.width * scale));
          canvas.height = Math.max(1, Math.round(bitmap.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Couldn’t prepare your photos. Please try again.");
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          let data = canvas.toDataURL("image/jpeg", 0.8);
          for (const quality of [0.65, 0.5, 0.35]) {
            if (data.length <= 330000) break;
            data = canvas.toDataURL("image/jpeg", quality);
          }
          if (data.length > 330000) {
            const smaller = document.createElement("canvas");
            smaller.width = Math.max(1, Math.round(canvas.width / 2));
            smaller.height = Math.max(1, Math.round(canvas.height / 2));
            const smallContext = smaller.getContext("2d");
            if (!smallContext) throw new Error("Couldn’t prepare your photos.");
            smallContext.drawImage(canvas, 0, 0, smaller.width, smaller.height);
            data = smaller.toDataURL("image/jpeg", 0.5);
          }
          if (data.length > 330000) throw new Error("One photo couldn’t be resized. Try a smaller version.");
          additions.push({ id: crypto.randomUUID(), name: file.name, data });
        } finally { bitmap.close(); }
      }
      setPhotos(current => [...current, ...additions]);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Couldn’t read these photos. Try another selection."); }
    finally { setReading(false); }
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photos.length || reading) { setMessage("Add a photo first."); return; }
    setLoading(true);
    setMessage("");
    setResults([]);
    setCopyMessage("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: photos.map(photo => photo.data), vibe, length, context, examples }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn’t generate captions. Please try again.");
      setResults(data.generations);
      setMessage("Three captions saved to your account.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Connection interrupted. Please try again."); }
    finally { setLoading(false); }
  }

  return <div className="studio-workspace"><form className="studio" onSubmit={generate} aria-busy={loading}>
    <fieldset disabled={loading || reading} className="photo-panel">
      <p className="eyebrow">01 / YOUR CAMERA ROLL</p><h2>One photo or a whole dump.</h2>
      {photos.length > 0 && <div className="photo-grid">{photos.map((photo, index) => <div className="photo-tile" key={photo.id}>
        {/* Local previews are already resized and don't need remote image optimization. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.data} alt={`Selected photo ${index + 1}: ${photo.name}`} />
        <button type="button" className="remove-photo" aria-label={`Remove photo ${index + 1}: ${photo.name}`} onClick={() => setPhotos(current => current.filter(item => item.id !== photo.id))}>×</button>
        <span className="photo-number">{index + 1}</span>
      </div>)}</div>}
      {photos.length < 10 && <label className={`upload-area ${photos.length ? "add-more" : ""}`} htmlFor="photos">
        <span className="upload-icon" aria-hidden="true">＋</span><strong>{photos.length ? "Add more photos" : "Pick your moments"}</strong><span>Choose one or more from your camera roll</span>
        <input id="photos" name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectPhotos} />
      </label>}
      <p className="small-note">{photos.length} / 10 photos · JPG, PNG or WebP · Up to 10 MB each</p>
      <p className="privacy-note">Your photos are resized and sent to Google Gemini to create captions. Your resized photos, captions, preferences, and generation activity are saved privately to your account and can be reviewed by studio administrators.</p>
    </fieldset>
    <fieldset disabled={loading || reading} className="controls-panel">
      <p className="eyebrow">02 / YOUR ENERGY</p><h2>Make it sound like you.</h2>
      <div className="field-label" id="vibe-label">What’s the vibe?</div>
      <div className="chips" role="group" aria-labelledby="vibe-label">{vibes.map(option => <button type="button" key={option} className={vibe === option ? "chip selected" : "chip"} aria-pressed={vibe === option} onClick={() => setVibe(option)}>{option}</button>)}</div>
      <label className="field-label" htmlFor="length">Keep it…</label>
      <select id="length" value={length} onChange={e => setLength(e.target.value)}><option>Short</option><option>Medium</option></select>
      <label className="field-label" htmlFor="context">A little context <span>(optional)</span></label>
      <textarea id="context" maxLength={500} rows={2} value={context} onChange={e => setContext(e.target.value)} placeholder="A weekend of coffee, friends, and little moments. Casual, no hashtags." />
      <details><summary>Have a signature style?</summary><label className="field-label" htmlFor="examples">Captions you’ve used or loved</label><textarea id="examples" maxLength={500} rows={2} value={examples} onChange={e => setExamples(e.target.value)} placeholder="a little bit of everything / life lately" /></details>
      <button className="primary-button" type="submit" disabled={!photos.length || loading || reading}>{loading ? "Finding your words…" : reading ? "Preparing photos…" : "Generate 3 captions ↗"}</button>

      <p className="status" role="status" aria-live="polite">{message}</p>
    </fieldset>
  </form>
  <section className="fresh-results" ref={resultsRef} tabIndex={-1} aria-labelledby="results-title">
    <p className="eyebrow">03 / YOUR WORDS</p><h2 id="results-title">{results.length ? "Which one feels like you?" : loading ? "Finding your words…" : "Your captions go here."}</h2>
    {!results.length && <div className="results-placeholder" role="status">{loading ? <><span className="loading-dot" aria-hidden="true" /><p>Considering your photos and your chosen vibe.<br />Three caption options are on their way.</p></> : <><span className="placeholder-mark" aria-hidden="true">✳</span><p>A little inspiration for your next post.<br />Add your photos and we’ll take it from here.</p></>}</div>}
    {results.length > 0 && <p className="small-note">Saved to your account. Copy a favorite, or rate each option.</p>}
    <div className="caption-grid">{results.map(result => <article className="caption-card" key={result.id}>
      <p className="caption-text">{result.generated_text}</p>
      <button type="button" className="copy-caption" onClick={() => copyCaption(result.generated_text)}>Copy caption</button>
      <VoteButtons generationId={result.id} userId={userId} />
    </article>)}</div><p role="status" className="small-note">{copyMessage}</p>
  </section></div>;
}
