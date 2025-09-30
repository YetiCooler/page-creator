import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
	// Keep minimal and client-side guard in dashboard to avoid server-side auth complexity
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard"],
};
