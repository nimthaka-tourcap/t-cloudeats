import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const VALID_EMAIL = process.env.CASHIER_EMAIL || "cashier@t-cloudeats.com";
    const VALID_PASSWORD = process.env.CASHIER_PASSWORD || "cashier@ti321";

    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      const response = NextResponse.json({ success: true, email: VALID_EMAIL });
      response.cookies.set("tce_auth", VALID_EMAIL, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Authentication service error." },
      { status: 500 }
    );
  }
}
