import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CameraMark from "@/app/components/CameraMark";
import CaptionPicker from "@/app/components/CaptionPicker";
export default async function PickPage() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/");
 return <main className="page picker-page"><header className="topbar"><Link className="wordmark" href="/"><CameraMark className="brand-camera" />caption studio</Link><nav aria-label="Caption navigation"><Link href="/">Create</Link><Link href="/captions">My favorites</Link><Link href="/captions?view=recent">Recent</Link></nav></header><CaptionPicker userId={user.id} /></main>;
}
