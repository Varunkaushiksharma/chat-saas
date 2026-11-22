import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next 16 "proxy" (formerly middleware). Two jobs:
//  1. keep the Supabase session cookie fresh
//  2. optimistic redirects (/dashboard needs a user, /login doesn't).
// Real authorization still happens in every API route (requireUser) and in RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims verifies the token locally (and refreshes it when needed): no round trip to the auth server
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  if (!user && path.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (!user && isApi) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  return response;
}

// The public widget endpoints (/api/widget/*) are intentionally NOT matched.
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/api/bots/:path*", "/api/bots", "/api/chat", "/api/inbox/:path*", "/api/inbox", "/api/overview", "/api/account", "/api/knowledge/:path*"],
};
