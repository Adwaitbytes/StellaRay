/**
 * Admin Users API - VC Analytics
 *
 * GET /api/admin/users - Returns all authenticated Google users with wallet addresses
 * Protected by admin API key
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  return authHeader === `Bearer ${adminKey}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [users, totalCount, todayCount, weekCount, byCountry, byDevice, dailyLogins] =
      await Promise.all([
        // All authenticated users with wallet addresses
        sql`
          SELECT
            google_email,
            google_name,
            google_picture,
            wallet_address,
            network,
            first_login_at,
            last_login_at,
            login_count,
            country,
            device_type
          FROM authenticated_users
          ORDER BY first_login_at DESC
        `,

        // Total authenticated users
        sql`SELECT COUNT(*) as total FROM authenticated_users`,

        // Today's new users
        sql`SELECT COUNT(*) as today FROM authenticated_users WHERE first_login_at >= CURRENT_DATE`,

        // This week's new users
        sql`SELECT COUNT(*) as week FROM authenticated_users WHERE first_login_at >= CURRENT_DATE - INTERVAL '7 days'`,

        // Users by country
        sql`
          SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
          FROM authenticated_users
          GROUP BY country
          ORDER BY count DESC
          LIMIT 10
        `,

        // Users by device
        sql`
          SELECT COALESCE(device_type, 'unknown') as device_type, COUNT(*) as count
          FROM authenticated_users
          GROUP BY device_type
          ORDER BY count DESC
        `,

        // Daily new user registrations (last 30 days)
        sql`
          SELECT
            DATE(first_login_at) as date,
            COUNT(*) as users
          FROM authenticated_users
          WHERE first_login_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(first_login_at)
          ORDER BY date ASC
        `,
      ]);

    // Calculate active users (logged in within last 7 days)
    const activeUsers = users.filter(
      (u: any) =>
        new Date(u.last_login_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Calculate repeat users (login_count > 1)
    const repeatUsers = users.filter((u: any) => Number(u.login_count) > 1).length;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalUsers: parseInt(totalCount[0]?.total || "0"),
        todayNewUsers: parseInt(todayCount[0]?.today || "0"),
        weekNewUsers: parseInt(weekCount[0]?.week || "0"),
        activeUsers,
        repeatUsers,
      },
      users,
      analytics: {
        byCountry,
        byDevice,
        dailyLogins,
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
