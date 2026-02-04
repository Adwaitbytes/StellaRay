/**
 * Quests API
 *
 * GET  /api/quests?email=...       — Get user's quest state + leaderboard
 * POST /api/quests                 — Register new quest participant
 * PATCH /api/quests                — Complete a task / record referral
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// Fixed reward end date: extended to Feb 20, 2026
const REWARD_END_DATE = "2026-02-20T23:59:59Z";

const TASKS = [
  { id: "follow_twitter", points: 5 },
  { id: "retweet_launch", points: 10 },
  { id: "quote_tweet", points: 15 },
  { id: "tag_friends", points: 10 },
  { id: "join_telegram", points: 10 },
];

const POINTS_PER_REFERRAL = 5;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SR";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// GET — fetch user state + leaderboard
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  try {
    // Always return leaderboard + stats
    const [leaderboard, totalParticipants] = await Promise.all([
      sql`
        SELECT name, referral_count, total_points, completed_tasks, created_at
        FROM quest_participants
        ORDER BY total_points DESC
        LIMIT 15
      `,
      sql`SELECT COUNT(*) as count FROM quest_participants`,
    ]);

    let user = null;
    let userRank = null;

    if (email) {
      const rows = await sql`
        SELECT id, email, name, referral_code, referred_by, referral_count,
               completed_tasks, total_points, created_at, last_active_at
        FROM quest_participants
        WHERE email = ${email}
      `;

      if (rows.length > 0) {
        user = rows[0];
        // Calculate rank
        const rankResult = await sql`
          SELECT COUNT(*) + 1 as rank
          FROM quest_participants
          WHERE total_points > ${user.total_points}
        `;
        userRank = parseInt(rankResult[0]?.rank || "1");
      }
    }

    return NextResponse.json({
      success: true,
      rewardEndDate: REWARD_END_DATE,
      totalParticipants: parseInt(totalParticipants[0]?.count || "0"),
      leaderboard: leaderboard.map((row, i) => ({
        rank: i + 1,
        name: row.name || "Anonymous",
        points: row.total_points,
        referrals: row.referral_count,
        tasksCompleted: JSON.parse(row.completed_tasks || "[]").length,
        joinedAt: row.created_at,
      })),
      user: user
        ? {
            email: user.email,
            name: user.name,
            referralCode: user.referral_code,
            referredBy: user.referred_by,
            referralCount: user.referral_count,
            completedTasks: JSON.parse(user.completed_tasks || "[]"),
            totalPoints: user.total_points,
            rank: userRank,
          }
        : null,
    });
  } catch (error) {
    console.error("Quests GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch quests" }, { status: 500 });
  }
}

// POST — register new participant
export async function POST(request: NextRequest) {
  try {
    const { email, name, referredBy } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 });
    }

    // Check if already registered
    const existing = await sql`SELECT id, referral_code FROM quest_participants WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Already registered",
        referralCode: existing[0].referral_code,
      });
    }

    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = /mobile/i.test(userAgent) ? "mobile" : /tablet/i.test(userAgent) ? "tablet" : "desktop";
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || null;

    // Generate unique referral code
    let referralCode = generateCode();
    // Ensure uniqueness (retry up to 5 times)
    for (let i = 0; i < 5; i++) {
      const dup = await sql`SELECT id FROM quest_participants WHERE referral_code = ${referralCode}`;
      if (dup.length === 0) break;
      referralCode = generateCode();
    }

    // Validate referredBy code (must exist and not be self)
    let validReferrer: string | null = null;
    if (referredBy) {
      const refRows = await sql`SELECT email FROM quest_participants WHERE referral_code = ${referredBy}`;
      if (refRows.length > 0 && refRows[0].email !== email) {
        validReferrer = referredBy;
        // Increment referrer's count and points
        await sql`
          UPDATE quest_participants
          SET referral_count = referral_count + 1,
              total_points = total_points + ${POINTS_PER_REFERRAL},
              last_active_at = CURRENT_TIMESTAMP
          WHERE referral_code = ${referredBy}
        `;
      }
    }

    // Insert new participant
    await sql`
      INSERT INTO quest_participants (email, name, referral_code, referred_by, country, device_type)
      VALUES (${email}, ${name || email.split("@")[0]}, ${referralCode}, ${validReferrer}, ${country}, ${deviceType})
    `;

    return NextResponse.json({
      success: true,
      message: "Registered successfully",
      referralCode,
      referredBy: validReferrer,
    });
  } catch (error) {
    console.error("Quests POST error:", error);
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 });
  }
}

// PATCH — complete a task
export async function PATCH(request: NextRequest) {
  try {
    const { email, taskId } = await request.json();

    if (!email || !taskId) {
      return NextResponse.json({ success: false, error: "email and taskId required" }, { status: 400 });
    }

    // Find user
    const rows = await sql`
      SELECT id, completed_tasks, total_points
      FROM quest_participants
      WHERE email = ${email}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const user = rows[0];
    const completedTasks: string[] = JSON.parse(user.completed_tasks || "[]");

    // Already completed
    if (completedTasks.includes(taskId)) {
      return NextResponse.json({ success: true, message: "Already completed", totalPoints: user.total_points });
    }

    // Validate task
    const task = TASKS.find((t) => t.id === taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "Invalid task" }, { status: 400 });
    }

    // Update
    completedTasks.push(taskId);
    const newPoints = user.total_points + task.points;

    await sql`
      UPDATE quest_participants
      SET completed_tasks = ${JSON.stringify(completedTasks)},
          total_points = ${newPoints},
          last_active_at = CURRENT_TIMESTAMP
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true, totalPoints: newPoints, completedTasks });
  } catch (error) {
    console.error("Quests PATCH error:", error);
    return NextResponse.json({ success: false, error: "Failed to complete task" }, { status: 500 });
  }
}
