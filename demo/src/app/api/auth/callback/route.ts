import { NextRequest, NextResponse } from "next/server";

/**
 * OAuth Callback Handler
 *
 * Handles the OAuth redirect from Google/Apple after user authentication.
 * Extracts the authorization code and redirects to the wallet page
 * where the frontend completes the zkLogin flow.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract OAuth response parameters
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Validate code presence
  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=missing_code", request.url)
    );
  }

  // Redirect to wallet page with code
  // The frontend will complete the OAuth flow and zkLogin setup
  const redirectUrl = new URL("/auth/complete", request.url);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  return NextResponse.redirect(redirectUrl);
}

/**
 * Handle POST for Apple Sign-In (uses form_post response mode)
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const code = formData.get("code") as string | null;
  const idToken = formData.get("id_token") as string | null;
  const state = formData.get("state") as string | null;
  const user = formData.get("user") as string | null;
  const error = formData.get("error") as string | null;

  // Handle errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Build redirect URL
  const redirectUrl = new URL("/auth/complete", request.url);

  if (code) {
    redirectUrl.searchParams.set("code", code);
  }
  if (idToken) {
    redirectUrl.searchParams.set("id_token", idToken);
  }
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }
  if (user) {
    redirectUrl.searchParams.set("user", user);
  }

  return NextResponse.redirect(redirectUrl);
}
