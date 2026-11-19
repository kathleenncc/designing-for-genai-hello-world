"use client";
import { useState } from "react";

type Props = { photos: string[]; caption: string; handle: string; avatarUrl?: string | null; placeholder?: boolean };

export default function InstagramPreview({ photos, caption, handle, avatarUrl, placeholder = false }: Props) {
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
      <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.4 5c2 0 3.3 1.1 3.9 2.3h3.4C14.3 6.1 15.6 5 17.6 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" /></svg>
      <svg viewBox="0 0 24 24"><path d="M20.5 11.5a8.5 8.5 0 1 1-4-7.2 8.4 8.4 0 0 1 4 7.2zM20.5 20.5l-2.7-3.3" /></svg>
      <svg viewBox="0 0 24 24"><path d="M21 3 3 10.5l7.5 2.8L13.3 21 21 3zM10.5 13.3 21 3" /></svg>
      {photos.length > 1 && <span className="ig-dots">{photos.map((_, i) => <i key={i} className={i === current ? "on" : ""} />)}</span>}
      <svg className="ig-save" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-5-6 5z" /></svg>
    </div>
    <figcaption className="ig-caption">
      <p className="ig-likes">Liked by your friends and others</p>
      <p key={caption} className={placeholder ? "ig-text ig-placeholder" : "ig-text"}><strong>{handle}</strong> {caption}</p>
      <p className="ig-time">JUST NOW</p>
    </figcaption>
  </figure>;
}
