import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerSupabaseClient() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
			},
			setAll(cookiesToSet) {
				const mutable = cookieStore as unknown as {
					set?: (name: string, value: string, options?: Record<string, unknown>) => void;
				};
				if (typeof mutable.set === "function") {
					cookiesToSet.forEach(({ name, value, options }) => {
						mutable.set?.(name, value, options as Record<string, unknown> | undefined);
					});
				}
			},
		},
	});
}
