import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Simple admin auth check (use env variable)
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY || "stellaray-admin-2026";
  return authHeader === `Bearer ${adminKey}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run all queries in parallel
    const [
      waitlistTotal,
      waitlistToday,
      waitlistWeek,
      waitlistBySource,
      waitlistByDevice,
      waitlistByBrowser,
      waitlistByCountry,
      waitlistDaily,
      paymentLinksStats,
      streamsStats,
      recentSignups,
    ] = await Promise.all([
      // Total waitlist signups
      sql`SELECT COUNT(*) as total FROM waitlist`,

      // Today's signups
      sql`SELECT COUNT(*) as today FROM waitlist WHERE created_at >= CURRENT_DATE`,

      // This week's signups
      sql`SELECT COUNT(*) as week FROM waitlist WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`,

      // Signups by source
      sql`
        SELECT source, COUNT(*) as count
        FROM waitlist
        GROUP BY source
        ORDER BY count DESC
        LIMIT 10
      `,

      // Signups by device type
      sql`
        SELECT device_type, COUNT(*) as count
        FROM waitlist
        WHERE device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
      `,

      // Signups by browser
      sql`
        SELECT browser, COUNT(*) as count
        FROM waitlist
        WHERE browser IS NOT NULL AND browser != 'unknown'
        GROUP BY browser
        ORDER BY count DESC
        LIMIT 5
      `,

      // Signups by country (top 10)
      sql`
        SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as count
        FROM waitlist
        GROUP BY country
        ORDER BY count DESC
        LIMIT 10
      `,

      // Daily signups (last 30 days)
      sql`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as signups
        FROM waitlist
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,

      // Payment links stats
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN CAST(paid_amount AS DECIMAL) END), 0) as total_volume
        FROM payment_links
      `,

      // Streams stats
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COALESCE(SUM(total_amount), 0) as total_volume
        FROM payment_streams
      `,

      // Recent signups (last 20)
      sql`
        SELECT email, source, device_type, browser, country, created_at, referral_code
        FROM waitlist
        ORDER BY created_at DESC
        LIMIT 20
      `,
    ]);

    // Calculate revenue estimates
    const paymentVolume = parseFloat(paymentLinksStats[0]?.total_volume || "0");
    const streamVolume = parseFloat(streamsStats[0]?.total_volume || "0");
    const estimatedRevenue = {
      paymentFees: paymentVolume * 0.003,
      streamFees: streamVolume * 0.001,
      total: paymentVolume * 0.003 + streamVolume * 0.001,
    };

    // Growth rate calculation
    const totalSignups = parseInt(waitlistTotal[0]?.total || "0");
    const weekSignups = parseInt(waitlistWeek[0]?.week || "0");
    const prevWeekSignups = totalSignups - weekSignups;
    const growthRate = prevWeekSignups > 0
      ? ((weekSignups - prevWeekSignups) / prevWeekSignups) * 100
      : 100;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overview: {
        totalSignups,
        todaySignups: parseInt(waitlistToday[0]?.today || "0"),
        weekSignups,
        growthRate: Math.round(growthRate * 10) / 10,
      },
      waitlist: {
        bySource: waitlistBySource,
        byDevice: waitlistByDevice,
        byBrowser: waitlistByBrowser,
        byCountry: waitlistByCountry,
        daily: waitlistDaily,
      },
      payments: {
        links: {
          total: parseInt(paymentLinksStats[0]?.total || "0"),
          active: parseInt(paymentLinksStats[0]?.active || "0"),
          paid: parseInt(paymentLinksStats[0]?.paid || "0"),
          volume: paymentVolume,
        },
        streams: {
          total: parseInt(streamsStats[0]?.total || "0"),
          active: parseInt(streamsStats[0]?.active || "0"),
          completed: parseInt(streamsStats[0]?.completed || "0"),
          volume: streamVolume,
        },
      },
      revenue: estimatedRevenue,
      recentSignups,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
