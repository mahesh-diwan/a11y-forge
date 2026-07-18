import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export async function GET() {
  const tokenOk = !!process.env.GITHUB_TOKEN;
  return NextResponse.json({
    status: "ok",
    ts: new Date().toISOString(),
    version: process.env.npm_package_version ?? "0.1.0",
    ready: tokenOk,
  });
}

export async function POST() {
  return NextResponse.json(
    { error: { code: "METHOD_NOT_ALLOWED", message: "Use GET" } },
    { status: 405, headers: { Allow: "GET" } },
  );
}
