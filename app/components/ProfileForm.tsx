"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";

type ProfileFormProps = {
    userId: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl?: string | null;
};

export default function ProfileForm({
                                        userId,
                                        firstName,
                                        lastName,
                                        avatarUrl,
                                    }: ProfileFormProps) {
    const [first, setFirst] = useState(firstName ?? "");
    const [last, setLast] = useState(lastName ?? "");
    const [message, setMessage] = useState("");
    const [currentAvatar, setCurrentAvatar] = useState(avatarUrl ?? "");

    const handleSave = async () => {
        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: first,
                last_name: last,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (error) {
            console.error(error);
            setMessage("Could not save profile.");
            return;
        }

        setMessage("Profile saved!");
    };

    const handlePhotoUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const fileExt = file.name.split(".").pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, file, {
                upsert: true,
            });

        if (uploadError) {
            console.error(uploadError);
            setMessage("Could not upload photo.");
            return;
        }

        const {
            data: { publicUrl },
        } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                avatar_url: publicUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (profileError) {
            console.error(profileError);
            setMessage("Photo uploaded, but profile could not be updated.");
            return;
        }

        setCurrentAvatar(publicUrl);
        setMessage("Profile photo updated!");
    };

    return (
        <div>
            {currentAvatar && (
                <div>
                    <img
                        src={currentAvatar}
                        alt="Profile photo"
                        width={150}
                    />
                </div>
            )}

            <div>
                <label>Profile photo</label>
                <br />
                <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                />
            </div>

            <br />

            <div>
                <label>First name</label>
                <br />
                <input
                    type="text"
                    value={first}
                    onChange={(e) => setFirst(e.target.value)}
                />
            </div>

            <br />

            <div>
                <label>Last name</label>
                <br />
                <input
                    type="text"
                    value={last}
                    onChange={(e) => setLast(e.target.value)}
                />
            </div>

            <br />

            <button onClick={handleSave}>
                Save profile
            </button>

            {message && <p>{message}</p>}
        </div>
    );
}