import { NextRequest, NextResponse } from "next/server";
import { sql, generateReferralCode, parseUserAgent } from "@/lib/db";

// Base count to start from (for social proof)
const BASE_COUNT = 15;

// GET - Fetch waitlist count and stats
export async function GET(request: NextRequest) {
  try {
    // Get real count from database
    const countResult = await sql`SELECT COUNT(*) as count FROM waitlist`;
    const realCount = parseInt(countResult[0]?.count || "0");

    // Get some stats for the dashboard
    const stats = await sql`
      SELECT
        COUNT(*) as total_signups,
        COUNT(DISTINCT country) as countries,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7d
      FROM waitlist
    `;

    // Top sources
    const topSources = await sql`
      SELECT source, COUNT(*) as count
      FROM waitlist
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `;

    return NextResponse.json({
      success: true,
      count: BASE_COUNT + realCount,
      realCount,
      stats: stats[0] || {},
      topSources,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading waitlist:", error);
    // Return base count if database fails
    return NextResponse.json({
      success: true,
      count: BASE_COUNT,
      realCount: 0,
      lastUpdated: new Date().toISOString(),
    });
  }
}

// POST - Add email to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      source = "website",
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
    } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Get request metadata
    const userAgent = request.headers.get("user-agent") || null;
    const referrer = request.headers.get("referer") || null;
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || null;

    // Parse user agent for device info
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Generate referral code
    const referralCode = generateReferralCode();

    // Check for duplicate
    const existing = await sql`
      SELECT id, referral_code FROM waitlist WHERE email = ${normalizedEmail}
    `;

    if (existing.length > 0) {
      // Get their position
      const position = await sql`
        SELECT COUNT(*) as pos FROM waitlist WHERE id <= ${existing[0].id}
      `;

      const totalCount = await sql`SELECT COUNT(*) as count FROM waitlist`;

      return NextResponse.json({
        success: true,
        message: "You're already on the waitlist!",
        alreadyExists: true,
        position: parseInt(position[0]?.pos || "1"),
        totalCount: BASE_COUNT + parseInt(totalCount[0]?.count || "0"),
        referralCode: existing[0].referral_code,
      });
    }

    // Insert new entry with all the data investors want to see
    const result = await sql`
      INSERT INTO waitlist (
        email,
        source,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        user_agent,
        ip_address,
        device_type,
        browser,
        os,
        referral_code,
        status
      ) VALUES (
        ${normalizedEmail},
        ${source},
        ${referrer},
        ${utm_source || null},
        ${utm_medium || null},
        ${utm_campaign || null},
        ${utm_content || null},
        ${utm_term || null},
        ${userAgent},
        ${ipAddress},
        ${deviceType},
        ${browser},
        ${os},
        ${referralCode},
        'pending'
      )
      RETURNING id, referral_code
    `;

    // Get total count
    const totalCount = await sql`SELECT COUNT(*) as count FROM waitlist`;
    const position = parseInt(totalCount[0]?.count || "1");

    // Log analytics event
    await sql`
      INSERT INTO waitlist_analytics (event_type, event_data, user_agent, ip_address, referrer)
      VALUES (
        'signup',
        ${JSON.stringify({ email: normalizedEmail, source })}::jsonb,
        ${userAgent},
        ${ipAddress},
        ${referrer}
      )
    `;

    return NextResponse.json({
      success: true,
      message: "Welcome to the waitlist!",
      position,
      totalCount: BASE_COUNT + position,
      referralCode: result[0]?.referral_code,
    });
  } catch (error: unknown) {
    console.error("Error adding to waitlist:", error);

    // Handle unique constraint violation (duplicate email)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return NextResponse.json({
        success: true,
        message: "You're already on the waitlist!",
        alreadyExists: true,
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}
