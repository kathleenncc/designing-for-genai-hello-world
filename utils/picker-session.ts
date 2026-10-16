"use client";
import { useSyncExternalStore } from "react";
export type PickerSession = { userId: string; photos: { id: string; name: string; data: string }[]; captions: { id: number; generated_text: string }[]; vibe: string; length: string; context: string; examples: string };
let session: PickerSession | null = null;
const listeners = new Set<() => void>();
export function setPickerSession(value: PickerSession) { session = value; listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function usePickerSession() { return useSyncExternalStore(subscribe, () => session, () => null); }
