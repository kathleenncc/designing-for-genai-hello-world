"use client";
import { useState } from "react";

type Props = { photos: string[]; caption: string; handle: string; avatarUrl?: string | null };

export default function InstagramPreview({ photos, caption, handle, avatarUrl }: Props) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, photos.length - 1);
  if (!photos.length) return null;
  return <figure className="ig-post" aria-label="Preview of your post">
    <header className="ig-header">
      <span className="ig-avatar" aria-hidden="true">
        {/* Profile photo comes from the user's own account. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {avatarUrl ? <img src={avatarUrl} alt="" /> : handle.charAt(0).toUpperCase()}
      </span>
      <strong>{handle}</strong>
      <span className="ig-more" aria-hidden="true">•••</span>
    </header>
    <div className="ig-photo">
      {/* Resized, in-memory user image; never a remote image request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[current]} alt={`Your post, photo ${current + 1} of ${photos.length}`} />
      {photos.length > 1 && <>
        <span className="ig-count" aria-hidden="true">{current + 1}/{photos.length}</span>
        {current > 0 && <button type="button" className="ig-nav ig-prev" onClick={() => setIndex(current - 1)} aria-label="Previous photo">‹</button>}
        {current < photos.length - 1 && <button type="button" className="ig-nav ig-next" onClick={() => setIndex(current + 1)} aria-label="Next photo">›</button>}
      </>}
    </div>
    <div className="ig-actions" aria-hidden="true">
      <span>♡</span><span>💬</span><span>➤</span>
      {photos.length > 1 && <span className="ig-dots">{photos.map((_, i) => <i key={i} className={i === current ? "on" : ""} />)}</span>}
      <span className="ig-save">⌑</span>
    </div>
    <figcaption className="ig-caption">
      <p className="ig-likes">Liked by your friends and others</p>
      <p key={caption} className="ig-text"><strong>{handle}</strong> {caption}</p>
      <p className="ig-time">JUST NOW</p>
    </figcaption>
  </figure>;
}
