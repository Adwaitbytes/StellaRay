/**
 * Track Authenticated User API
 *
 * POST /api/auth/track - Records a Google-authenticated user with their derived wallet address
 * Called after successful Google login to persist user data for VC analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sub, walletAddress, network = "testnet" } = body;

    if (!sub || !walletAddress) {
      return NextResponse.json(
        { error: "Missing sub or walletAddress" },
        { status: 400 }
      );
    }

    // Parse user agent for device info
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = /mobile/i.test(userAgent)
      ? "mobile"
      : /tablet/i.test(userAgent)
      ? "tablet"
      : "desktop";

    // Get country from headers (set by Vercel/Cloudflare)
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;

    // Upsert: insert new user or update last_login + increment count
    await sql`
      INSERT INTO authenticated_users (
        google_sub, google_email, google_name, google_picture,
        wallet_address, network, user_agent, country, device_type
      ) VALUES (
        ${sub},
        ${session.user.email},
        ${session.user.name || null},
        ${session.user.image || null},
        ${walletAddress},
        ${network},
        ${userAgent},
        ${country},
        ${deviceType}
      )
      ON CONFLICT (google_sub) DO UPDATE SET
        last_login_at = CURRENT_TIMESTAMP,
        login_count = authenticated_users.login_count + 1,
        google_email = EXCLUDED.google_email,
        google_name = EXCLUDED.google_name,
        google_picture = EXCLUDED.google_picture,
        wallet_address = EXCLUDED.wallet_address,
        network = EXCLUDED.network,
        user_agent = EXCLUDED.user_agent,
        country = COALESCE(EXCLUDED.country, authenticated_users.country),
        device_type = EXCLUDED.device_type
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking authenticated user:", error);
    return NextResponse.json(
      { error: "Failed to track user" },
      { status: 500 }
    );
  }
}
