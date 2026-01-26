import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";

// POST - Initialize database schema
export async function POST() {
  try {
    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: "Database schema initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize database" },
      { status: 500 }
    );
  }
}

// GET - Check database status
export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize the database schema",
  });
}
