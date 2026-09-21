import { supabase } from "@/utils/supabase/client";

export default async function Home() {
    const { data: spots, error } = await supabase
        .from("favorite_froyo_spots")
        .select("*")
        .order("id");

    if (error) {
        return <main>Could not load frozen yogurt spots.</main>;
    }

    return (
        <main>
            <h1>My Favorite Frozen Yogurt Spots</h1>

            <ul>
                {spots.map((spot) => (
                    <li key={spot.id}>
                        {spot.name} — {spot.location}
                    </li>
                ))}
            </ul>
        </main>
    );
}