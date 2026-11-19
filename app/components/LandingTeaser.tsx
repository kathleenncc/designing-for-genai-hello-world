"use client";
import { useState } from "react";
import InstagramPreview from "./InstagramPreview";
import GoogleLoginButton from "./GoogleLoginButton";

const samples: Record<string, string> = {
  Casual: "a little weekend upstate, mostly apples and good company",
  Witty: "came for the apples, stayed because we got lost in the orchard",
  Chic: "october, in soft focus.",
  Playful: "certified apple pickers 🍎 (we ate half of them)",
  Minimal: "upstate.",
};
const photos = ["/sample-orchard.svg", "/sample-coffee.svg", "/sample-sunset.svg"];

export default function LandingTeaser() {
  const [vibe, setVibe] = useState("Casual");
  return <section className="teaser" aria-labelledby="teaser-title">
    <div className="teaser-demo">
      <p className="eyebrow">TRY IT · SAMPLE POST</p>
      <div className="chips" role="group" aria-label="Try a vibe">{Object.keys(samples).map(option => <button type="button" key={option} className={vibe === option ? "chip selected" : "chip"} aria-pressed={vibe === option} onClick={() => setVibe(option)}>{option}</button>)}</div>
      <InstagramPreview photos={photos} caption={samples[vibe]} handle="maya" />
      <p className="small-note">Tap a vibe to see how the caption changes. This is a sample post.</p>
    </div>
    <div className="teaser-side">
      <p className="eyebrow">LESS OVERTHINKING. MORE POSTING.</p>
      <h2 id="teaser-title">Now imagine it with <em>your</em> photos.</h2>
      <p className="teaser-copy">Sign in to caption your own camera roll and keep the captions that sound like you.</p>
      <ul className="locked-list" aria-label="Unlocked when you sign in">
        <li><span className="lock" aria-hidden="true">🔒</span><div><strong>Your own photos</strong><span>Upload one photo or a whole dump, up to 10.</span><div className="locked-peek" aria-hidden="true"><i /><i /><i /><i /></div></div></li>
        <li><span className="lock" aria-hidden="true">🔒</span><div><strong>♡ My favorites</strong><span>Every caption you save, ready for your next post.</span><div className="locked-peek text" aria-hidden="true">golden hour, unbothered · sunday reset · core memory unlocked</div></div></li>
        <li><span className="lock" aria-hidden="true">🔒</span><div><strong>✦ Tuned to your voice</strong><span>The more you save, the more your captions sound like you.</span><div className="locked-peek text" aria-hidden="true">Tuned to your voice · learned from 12 saved captions</div></div></li>
      </ul>
      <div className="teaser-signin"><GoogleLoginButton /><p className="small-note">Free · Sign in with your Google account</p></div>
    </div>
  </section>;
}
