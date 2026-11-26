import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  GOOGLE_LOCATION_ID,
  getGoogleAccessToken,
  getGoogleAccountId,
  transformToGoogleFoodMenu,
} from "@/lib/services/google-menu-service";

export async function GET() {
  try {
    const accessToken = await getGoogleAccessToken();
    const accountId = await getGoogleAccountId(accessToken);
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${GOOGLE_LOCATION_ID}/foodMenus`;

    const response = await fetch(googleApiUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: "Failed to fetch menu from Google", details: errText },
        { status: response.status }
      );
    }

    const googleMenuData = await response.json();
    if (!googleMenuData.menus || googleMenuData.menus.length === 0) {
      return NextResponse.json({ message: "No menus found on Google." });
    }

    const sections = googleMenuData.menus[0].sections || [];
    const updatedItems: any[] = [];

    for (const section of sections) {
      for (const item of section.items || []) {
        const idMatch = item.itemId?.match(/^item_(\d+)$/);
        if (!idMatch || !item.price) continue;
        const dbId = parseInt(idMatch[1], 10);
        const price =
          parseFloat(item.price.units) +
          (item.price.nanos ? item.price.nanos / 1e9 : 0);
        const title = item.displayName?.[0]?.value || null;

        const updateData: any = { price };
        if (title) updateData.title = title;

        const { data, error } = await supabase
          .from("tce_menu_items")
          .update(updateData)
          .eq("id", dbId)
          .select();

        if (!error && data && data.length > 0) {
          updatedItems.push(data[0]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported menu from Google. Updated ${updatedItems.length} items in database.`,
      updatedItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, accountId } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Invalid payload: 'items' array is required." },
        { status: 400 }
      );
    }
    if (!accountId) {
      return NextResponse.json(
        { error: "Google 'accountId' is required for the URL path." },
        { status: 400 }
      );
    }

    let accessToken: string;
    try {
      accessToken = await getGoogleAccessToken();
    } catch (authError: any) {
      return NextResponse.json(
        { error: "Google Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    const googlePayload = transformToGoogleFoodMenu(items);
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${GOOGLE_LOCATION_ID}/foodMenus`;

    const response = await fetch(googleApiUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googlePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to sync menu with Google Business Profile.",
          statusCode: response.status,
          googleError: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: "Menu successfully synchronized with Google Business Profile.",
      locationId: GOOGLE_LOCATION_ID,
      googleResponse: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
