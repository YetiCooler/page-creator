"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function DashboardPage() {
	const supabase = getBrowserSupabaseClient();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [userId, setUserId] = useState<string | null>(null);
	const [username, setUsername] = useState<string | null>(null);
	const [titleDraft, setTitleDraft] = useState<string>("Untitled page");
	const [saving, setSaving] = useState(false);
	const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
	const editorRef = useRef<HTMLDivElement | null>(null);
	const debounceRef = useRef<number | null>(null);

	useEffect(() => {
		(async () => {
			const { data: userData } = await supabase.auth.getUser();
			const authedUserId = userData.user?.id ?? null;
			if (!authedUserId) {
				router.replace("/login");
				return;
			}
			setUserId(authedUserId);

			// Ensure profile exists and has a username (basic derivation from email prefix)
			const { data: session } = await supabase.auth.getSession();
			const email = session.session?.user.email ?? "user";
			const derived = email.split("@")[0];
			await supabase.from("profiles").upsert({ id: authedUserId, username: derived }).eq("id", authedUserId);
			setUsername(derived);

			// Load draft title or create a default page
			const { data: page, error: pageError } = await supabase
				.from("pages")
				.select("id, draft_title")
				.eq("owner_id", authedUserId)
				.eq("slug", "home")
				.single();

			if (pageError && pageError.code !== "PGRST116") {
				console.error(pageError);
			}

			const initialText = page?.draft_title ?? "Untitled page";
			if (!page) {
				await supabase.from("pages").upsert({ owner_id: authedUserId, slug: "home", draft_title: initialText });
			}
			setTitleDraft(initialText);
			if (editorRef.current) {
				editorRef.current.innerText = initialText;
			}

			setLoading(false);
		})();
	// Run once on mount/auth load
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router, supabase]);

	const saveDraft = useCallback(async (text: string) => {
		if (!userId) return;
		setSaving(true);
		await supabase
			.from("pages")
			.update({ draft_title: text, updated_at: new Date().toISOString() })
			.eq("owner_id", userId)
			.eq("slug", "home");
		setSaving(false);
		setLastSavedAt(new Date());
	}, [supabase, userId]);

	const scheduleSave = useCallback((text: string) => {
		if (debounceRef.current) {
			window.clearTimeout(debounceRef.current);
		}
		debounceRef.current = window.setTimeout(() => {
			saveDraft(text);
		}, 500);
	}, [saveDraft]);

	const handleTitleInput = useCallback((event: React.FormEvent<HTMLDivElement>) => {
		const newText = event.currentTarget.innerText;
		setTitleDraft(newText);
		scheduleSave(newText);
	}, [scheduleSave]);

	const preventEnter = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter") {
			event.preventDefault();
		}
	}, []);

	const publishNow = useCallback(async () => {
		if (!userId) return;
		await supabase
			.from("pages")
			.update({ published_title: titleDraft, published_at: new Date().toISOString() })
			.eq("owner_id", userId)
			.eq("slug", "home");
		alert("Published! View your site at /web/" + username);
	}, [supabase, titleDraft, userId, username]);

	if (loading) {
		return (
			<div className="flex min-h-dvh items-center justify-center p-6">
				<div className="animate-pulse text-sm text-neutral-500">Loading…</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl p-6 md:p-8">
			<div className="mb-4 flex items-center gap-3">
				<h1 className="text-2xl font-semibold">Dashboard</h1>
				<span className="text-xs text-neutral-500">
					{saving ? "Saving…" : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : "Not saved yet"}
				</span>
				<a
					className="ml-auto inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
					href={"/web/" + username}
				>
					View public
				</a>
				<button
					className="inline-flex items-center rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
					onClick={async () => {
						await supabase.auth.signOut();
						router.replace("/login");
					}}
				>
					Sign out
				</button>
			</div>

			<div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
				<p className="mb-2 text-sm text-neutral-500">Edit Your Page</p>
				<p className="mb-4 text-xs text-neutral-500">
					Your page is live at <a className="underline" href={"/web/" + username}>/web/{username}</a>
				</p>
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					onInput={handleTitleInput}
					onKeyDown={preventEnter}
					className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-2xl font-bold outline-none ring-0 transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-700 dark:focus:ring-neutral-800"
				/>
				<div className="mt-4 flex gap-2">
					<button
						className="inline-flex items-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
						onClick={publishNow}
					>
						Publish
					</button>
					<a
						className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
						href={"/web/" + username}
					>
						Preview
					</a>
				</div>
			</div>
		</div>
	);
}
