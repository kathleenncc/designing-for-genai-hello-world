"use client";
import { useEffect, useRef, useState } from "react";

// A soft, sculptural camera that takes a photo, which develops into a post.
const shots = [
  { photo: "/sample-coffee.svg", caption: "my love language is a café with good lighting" },
  { photo: "/sample-arch.svg", caption: "sunday, in soft focus." },
  { photo: "/sample-sea.svg", caption: "lately." },
];
type Phase = "ready" | "shutter" | "eject" | "develop" | "post" | "exit";

export default function LoginCamera() {
  const stage = useRef<HTMLDivElement>(null);
  const [shot, setShot] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [typed, setTyped] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      later(0, () => { setPhase("post"); setTyped(shots[0].caption.length); setLiked(true); });
      return () => timers.forEach(clearTimeout);
    }
    let index = 0;
    function cycle() {
      const caption = shots[index].caption;
      setShot(index); setPhase("ready"); setTyped(0); setLiked(false);
      later(700, () => setPhase("shutter"));
      later(1100, () => setPhase("eject"));
      later(2100, () => setPhase("develop"));
      const typeStart = 3100;
      later(typeStart, () => setPhase("post"));
      for (let i = 1; i <= caption.length; i++) later(typeStart + i * 45, () => setTyped(i));
      const typedEnd = typeStart + caption.length * 45;
      later(typedEnd + 450, () => setLiked(true));
      later(typedEnd + 2300, () => setPhase("exit"));
      later(typedEnd + 3200, () => { index = (index + 1) % shots.length; cycle(); });
    }
    cycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const element = stage.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    function tilt(event: PointerEvent) {
      const x = event.clientX / window.innerWidth - .5, y = event.clientY / window.innerHeight - .5;
      element!.style.setProperty("--ry", `${(x * 14).toFixed(2)}deg`);
      element!.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    }
    window.addEventListener("pointermove", tilt);
    return () => window.removeEventListener("pointermove", tilt);
  }, []);

  const current = shots[shot];
  return <div className="lc-stage" ref={stage} data-phase={phase} aria-hidden="true">
    <div className="lc-tilt">
      <div className="lc-card">
        <div className="lc-card-head"><i /> <span>you</span></div>
        <div className="lc-card-photo">
          {/* Static sample illustration. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.photo} alt="" />
          <span className="lc-develop" />
        </div>
        <div className="lc-card-foot">
          <svg className={liked ? "lc-heart liked" : "lc-heart"} viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.4 5c2 0 3.3 1.1 3.9 2.3h3.4C14.3 6.1 15.6 5 17.6 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" /></svg>
          <p><b>you</b> {current.caption.slice(0, typed)}<span className="lc-caret" /></p>
        </div>
      </div>
      <div className="lc-camera">
        <svg viewBox="0 0 300 200">
          <defs>
            <linearGradient id="lcBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fdfcfa" /><stop offset=".55" stopColor="#eeeae4" /><stop offset="1" stopColor="#d9d3ca" /></linearGradient>
            <linearGradient id="lcBand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ebe6de" /><stop offset="1" stopColor="#d6cfc5" /></linearGradient>
            <linearGradient id="lcTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e4dfd8" /></linearGradient>
            <radialGradient id="lcRing" cx=".4" cy=".35" r=".75"><stop offset="0" stopColor="#ffffff" /><stop offset=".6" stopColor="#e7e2db" /><stop offset="1" stopColor="#c7c0b6" /></radialGradient>
            <radialGradient id="lcGlass" cx=".38" cy=".32" r=".8"><stop offset="0" stopColor="#5b5853" /><stop offset=".45" stopColor="#2c2a27" /><stop offset="1" stopColor="#141312" /></radialGradient>
            <radialGradient id="lcFlash" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          </defs>
          <rect className="lc-button" x="40" y="26" width="44" height="18" rx="8" fill="url(#lcTop)" stroke="#d8d2c9" />
          <rect x="98" y="14" width="104" height="44" rx="14" fill="url(#lcTop)" stroke="#e0dad2" />
          <rect x="132" y="26" width="36" height="14" rx="5" fill="#2c2a27" opacity=".85" />
          <rect x="8" y="40" width="284" height="150" rx="28" fill="url(#lcBody)" />
          <rect x="8" y="98" width="284" height="66" fill="url(#lcBand)" opacity=".9" />
          <rect x="8.5" y="40.5" width="283" height="149" rx="27.5" fill="none" stroke="#fff" strokeOpacity=".9" />
          <rect x="222" y="58" width="46" height="24" rx="7" fill="#f4f1ec" stroke="#d9d3ca" />
          <rect className="lc-flashwin" x="226" y="62" width="38" height="16" rx="5" fill="#fff" />
          <circle cx="40" cy="70" r="5" fill="#e8c4c8" />
          <circle cx="150" cy="118" r="64" fill="#cfc8be" opacity=".5" transform="translate(3 5)" />
          <circle cx="150" cy="118" r="62" fill="url(#lcRing)" />
          <circle cx="150" cy="118" r="49" fill="#e9e4dd" stroke="#d3ccc2" />
          <circle cx="150" cy="118" r="40" fill="url(#lcGlass)" />
          <circle cx="150" cy="118" r="22" fill="#1f1e1c" stroke="#3d3a36" strokeWidth="2" />
          <ellipse cx="136" cy="102" rx="13" ry="8" fill="#fff" opacity=".55" transform="rotate(-35 136 102)" />
          <circle cx="166" cy="132" r="4" fill="#fff" opacity=".5" />
          <circle className="lc-flashglow" cx="245" cy="70" r="80" fill="url(#lcFlash)" />
        </svg>
      </div>
      <div className="lc-shadow" />
    </div>
  </div>;
}
