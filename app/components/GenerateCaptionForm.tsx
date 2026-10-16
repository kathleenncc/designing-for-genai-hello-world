"use client";
import { setPickerSession } from "@/utils/picker-session";


import { useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";



const vibes = ["Casual", "Witty", "Chic", "Playful", "Minimal"];
export default function GenerateCaptionForm({ userId }: { userId: string }) {
  const router = useRouter();
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
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos: photos.map(photo => photo.data), vibe, length, context, examples }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn’t generate captions. Please try again.");
      setPickerSession({ userId, photos, captions: data.generations, vibe, length, context, examples });
      router.push("/pick");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Connection interrupted. Please try again."); }
    finally { setLoading(false); }
  }

  return <div className="studio-workspace create-workspace"><form className="studio" onSubmit={generate} aria-busy={loading}>
    <fieldset disabled={loading || reading} className="photo-panel">
      <p className="eyebrow">01 — PHOTOGRAPHS</p><h2>Your next post.</h2><p className="panel-description">One photograph or a collection. Start with what you want to share.</p>
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
      <details className="privacy-details"><summary>Photo privacy · processed by Google Gemini</summary><p className="privacy-note">Your photos are resized and sent to Google Gemini to create captions. Photos stay in this tab for your preview and aren’t saved to your account. Your captions and preferences are saved.</p></details>
    </fieldset>
    <fieldset disabled={loading || reading} className="controls-panel">
      <p className="eyebrow">02 — DIRECTION</p><h2>The details.</h2>
      <div className="field-label" id="vibe-label">What’s the vibe?</div>
      <div className="chips" role="group" aria-labelledby="vibe-label">{vibes.map(option => <button type="button" key={option} className={vibe === option ? "chip selected" : "chip"} aria-pressed={vibe === option} onClick={() => setVibe(option)}>{option}</button>)}</div>
      <label className="field-label" htmlFor="length">Length</label>
      <select id="length" value={length} onChange={e => setLength(e.target.value)}><option>Short</option><option>Medium</option></select>
      <label className="field-label" htmlFor="context">A little context <span>(optional)</span></label>
      <textarea id="context" maxLength={500} rows={2} value={context} onChange={e => setContext(e.target.value)} placeholder="A weekend of coffee, friends, and little moments. Casual, no hashtags." />
      <details><summary>Personal style</summary><label className="field-label" htmlFor="examples">Captions you’ve used or loved</label><textarea id="examples" maxLength={500} rows={2} value={examples} onChange={e => setExamples(e.target.value)} placeholder="a little bit of everything / life lately" /></details>
      <button className="primary-button" type="submit" disabled={!photos.length || loading || reading}>{loading ? "Finding your words…" : reading ? "Preparing photos…" : "Create captions →"}</button>

      {loading && <p className="generation-progress" role="status"><span className="loading-dot" aria-hidden="true" />Finding your words. Your photo-and-caption picker opens when ready.</p>}
      <p className="status" role="status" aria-live="polite">{message}</p>
    </fieldset>
  </form>
</div>;
}
