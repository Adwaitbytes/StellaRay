/**
 * Database Migration API
 *
 * POST /api/admin/migrate - Runs database migrations
 * Protected by admin API key
 */

import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  return authHeader === `Bearer ${adminKey}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database migrated successfully" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: "Migration failed" },
      { status: 500 }
    );
  }
}
