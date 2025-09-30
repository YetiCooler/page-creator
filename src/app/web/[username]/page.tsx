import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
	const supabase = await getServerSupabaseClient();
	const { data: profile } = await supabase
		.from("profiles")
		.select("id")
		.eq("username", params.username)
		.single();
	if (!profile) {
		return { title: params.username, description: "User site" };
	}
	const { data: page } = await supabase
		.from("pages")
		.select("published_title")
		.eq("owner_id", profile.id)
		.eq("slug", "home")
		.single();
	const title = page?.published_title ?? params.username;
	return { title, description: `Page by ${params.username}` };
}

export default async function PublicUserPage({ params }: { params: { username: string } }) {
	const supabase = await getServerSupabaseClient();
	const { data: profile } = await supabase
		.from("profiles")
		.select("id")
		.eq("username", params.username)
		.single();
	if (!profile) {
		return (
			<div className="mx-auto max-w-3xl p-6">
				<div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
					<p className="text-sm text-neutral-500">User not found</p>
				</div>
			</div>
		);
	}
	const { data: page } = await supabase
		.from("pages")
		.select("published_title, published_at")
		.eq("owner_id", profile.id)
		.eq("slug", "home")
		.single();

	return (
		<div className="mx-auto max-w-3xl p-6 md:p-10">
			<div className="rounded-3xl border border-neutral-200/70 bg-white/70 p-10 text-center shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/40">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
						<path fillRule="evenodd" d="M12 2.25a4.5 4.5 0 0 0-2.735 8.118A8.25 8.25 0 0 0 3 18a.75.75 0 0 0 1.5 0 7.5 7.5 0 1 1 15 0 .75.75 0 0 0 1.5 0 8.25 8.25 0 0 0-6.265-7.632A4.5 4.5 0 0 0 12 2.25Z" clipRule="evenodd" />
					</svg>
				</div>
				<p className="text-xs uppercase tracking-widest text-neutral-500">@{params.username}</p>
				<h1 className="mt-3 text-2xl font-bold md:text-3xl">{page?.published_title ?? "No title set yet"}</h1>
				{page?.published_at ? (
					<p className="mt-2 text-sm text-neutral-500">Published {new Date(page.published_at).toLocaleString()}</p>
				) : null}
			</div>
		</div>
	);
}
