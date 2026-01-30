/**
 * Backfill Authenticated Users API
 *
 * POST /api/admin/backfill-users - Populates authenticated_users from existing tables
 * Pulls email + wallet address pairs from payment_links and payment_streams
 * Protected by admin API key
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY || "stellaray-admin-2026";
  return authHeader === `Bearer ${adminKey}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Collect unique email + wallet pairs from payment_links
    const paymentLinkUsers = await sql`
      SELECT DISTINCT
        creator_email as email,
        creator_address as wallet_address,
        network,
        MIN(created_at) as first_seen
      FROM payment_links
      WHERE creator_email IS NOT NULL AND creator_address IS NOT NULL
      GROUP BY creator_email, creator_address, network
    `;

    // Collect unique email + wallet pairs from payment_streams (senders)
    const streamSenders = await sql`
      SELECT DISTINCT
        sender_email as email,
        sender_address as wallet_address,
        network,
        MIN(created_at) as first_seen
      FROM payment_streams
      WHERE sender_email IS NOT NULL AND sender_address IS NOT NULL
      GROUP BY sender_email, sender_address, network
    `;

    // Collect unique email + wallet pairs from payment_streams (recipients)
    const streamRecipients = await sql`
      SELECT DISTINCT
        recipient_email as email,
        recipient_address as wallet_address,
        network,
        MIN(created_at) as first_seen
      FROM payment_streams
      WHERE recipient_email IS NOT NULL AND recipient_address IS NOT NULL
      GROUP BY recipient_email, recipient_address, network
    `;

    // Merge all users, deduplicate by email
    interface BackfillUser { email: string; wallet_address: string; network: string; first_seen: string }
    const allUsers = [...paymentLinkUsers, ...streamSenders, ...streamRecipients];
    const uniqueByEmail = new Map<string, BackfillUser>();

    for (const user of allUsers) {
      const u = user as BackfillUser;
      const existing = uniqueByEmail.get(u.email);
      if (!existing || new Date(u.first_seen) < new Date(existing.first_seen)) {
        uniqueByEmail.set(u.email, u);
      }
    }

    let inserted = 0;
    let skipped = 0;

    for (const user of uniqueByEmail.values()) {
      try {
        // Use email hash as a placeholder google_sub since we don't have the real one
        const placeholderSub = `backfill_${Buffer.from(user.email).toString("base64url")}`;

        await sql`
          INSERT INTO authenticated_users (
            google_sub, google_email, google_name, wallet_address,
            network, first_login_at, last_login_at, login_count
          ) VALUES (
            ${placeholderSub},
            ${user.email},
            ${user.email.split("@")[0]},
            ${user.wallet_address},
            ${user.network || "testnet"},
            ${user.first_seen},
            ${user.first_seen},
            1
          )
          ON CONFLICT (google_sub) DO NOTHING
        `;
        inserted++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill complete`,
      details: {
        sourcesScanned: {
          paymentLinks: paymentLinkUsers.length,
          streamSenders: streamSenders.length,
          streamRecipients: streamRecipients.length,
        },
        uniqueUsers: uniqueByEmail.size,
        inserted,
        skipped,
      },
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return NextResponse.json(
      { success: false, error: "Backfill failed" },
      { status: 500 }
    );
  }
}
