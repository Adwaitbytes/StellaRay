import { NextRequest, NextResponse } from "next/server";

/**
 * Mock OAuth Callback for Demo Mode
 *
 * Simulates the OAuth flow without requiring real credentials.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get("provider") || "google";

  // Simulate successful OAuth - redirect to completion page with mock code
  const redirectUrl = new URL("/auth/complete", request.url);
  redirectUrl.searchParams.set("code", `mock_code_${Date.now()}`);
  redirectUrl.searchParams.set("provider", provider);
  redirectUrl.searchParams.set("demo", "true");

  return NextResponse.redirect(redirectUrl);
}
