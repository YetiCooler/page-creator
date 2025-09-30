"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function LoginPage() {
	const router = useRouter();
	const supabase = getBrowserSupabaseClient();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = useCallback(async (event: React.FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setErrorMessage(null);
		try {
			const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (signInError) {
				// Fallback to sign up if user does not exist
				const { error: signUpError } = await supabase.auth.signUp({ email, password });
				if (signUpError) {
					throw signUpError;
				}
			}
			router.replace("/dashboard");
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Authentication failed";
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	}, [email, password, router, supabase]);

	return (
		<div className="flex min-h-dvh items-center justify-center px-4 py-16">
			<div className="w-full max-w-md">
				<div className="mb-6 text-center">
					<h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
					<p className="mt-1 text-sm text-neutral-500">Sign in or create an account to get started</p>
				</div>
				<div className="rounded-2xl border border-neutral-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/60">
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium">Email</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-600 dark:focus:ring-neutral-800"
							/>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:focus:border-neutral-600 dark:focus:ring-neutral-800"
							/>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
						>
							{loading ? "Working..." : "Sign In"}
						</button>
						{errorMessage ? (
							<p className="text-sm text-rose-500">{errorMessage}</p>
						) : null}
						<p className="text-center text-xs text-neutral-500">
							Don’t have an account? It will be created on first sign in.
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
