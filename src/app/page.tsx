import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
	const supabase = await getServerSupabaseClient();
	const { data } = await supabase.auth.getSession();
	if (data.session) {
		redirect("/dashboard");
	}
	redirect("/login");
}
