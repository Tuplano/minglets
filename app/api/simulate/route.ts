import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Cron job triggered at", new Date().toISOString());
  return NextResponse.json({ message: "Cron job executed" });
}