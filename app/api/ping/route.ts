import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight 32KB payload for accurate client-side Mbps measurement
const PING_PAYLOAD = "X".repeat(32 * 1024);

export async function GET() {
  return new NextResponse(PING_PAYLOAD, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
