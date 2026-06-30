import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// --- Google Business Profile Food Menus API Types ---
interface GoogleMoney {
  currencyCode: string;
  units: string; // Google expects units as string representing whole units (int64)
  nanos?: number;
}

interface GoogleText {
  languageCode: string;
  value: string;
}

interface GoogleMenuItem {
  itemId: string;
  displayName: GoogleText[];
  description?: GoogleText[];
  price?: GoogleMoney;
}

interface GoogleMenuSection {
  sectionId: string;
  displayName: GoogleText[];
  items: GoogleMenuItem[];
}

interface GoogleMenu {
  menuId: string;
  displayName: GoogleText[];
  sections: GoogleMenuSection[];
}

interface GoogleFoodMenusPayload {
  name?: string;
  menus: GoogleMenu[];
}

// Input Database Item structure
interface DbMenuItem {
  id: number | string;
  title: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
}

/**
 * Transforms a flat list of database menu items into Google's nested foodMenus payload structure.
 */
function transformToGoogleFoodMenu(dbItems: DbMenuItem[]): GoogleFoodMenusPayload {
  const categoriesMap = new Map<string, DbMenuItem[]>();
  dbItems.forEach((item) => {
    const category = item.category || "General";
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(item);
  });

  const sections: GoogleMenuSection[] = Array.from(categoriesMap.entries()).map(([categoryName, items]) => {
    const sectionId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    const googleItems: GoogleMenuItem[] = items.map((item) => {
      const itemId = `item_${item.id}`;
      
      return {
        itemId,
        displayName: [
          {
            languageCode: "en-US",
            value: item.title,
          },
        ],
        description: item.description 
          ? [
              {
                languageCode: "en-US",
                value: item.description,
              },
            ]
          : undefined,
        price: {
          currencyCode: "LKR",
          units: Math.floor(item.price).toString(),
          nanos: Math.round((item.price % 1) * 1e9),
        },
      };
    });

    return {
      sectionId,
      displayName: [
        {
          languageCode: "en-US",
          value: categoryName,
        },
      ],
      items: googleItems,
    };
  });

  return {
    menus: [
      {
        menuId: "t_cloud_eats_menu",
        displayName: [
          {
            languageCode: "en-US",
            value: "T-Cloud Eats Main Menu",
          },
        ],
        sections,
      },
    ],
  };
}

/**
 * Helper to dynamically generate a new access token using the refresh token.
 */
async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing required Google OAuth credentials in environment variables.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token refresh failed: ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Helper to dynamically discover the Google Account ID.
 */
async function getGoogleAccountId(accessToken: string): Promise<string> {
  const response = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Google accounts: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  if (!data.accounts || data.accounts.length === 0) {
    throw new Error("No Google Business accounts found for this user.");
  }

  const accountName = data.accounts[0].name;
  return accountName.split("/")[1];
}

/**
 * GET Handler: Pulls the menu from Google Business Profile, updates Supabase, and broadcasts via Realtime.
 */
export async function GET() {
  try {
    const locationId = "4190813937772677288";
    
    const accessToken = await getGoogleAccessToken();
    const accountId = await getGoogleAccountId(accessToken);
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/foodMenus`;

    console.log(`[Import] Fetching menu from Google location ${locationId}...`);
    const response = await fetch(googleApiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
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

    const googleMenu = googleMenuData.menus[0];
    const sections = googleMenu.sections || [];
    const updatedItems: any[] = [];

    for (const section of sections) {
      const items = section.items || [];
      for (const item of items) {
        const idMatch = item.itemId.match(/^item_(\d+)$/);
        if (!idMatch) continue;
        const dbId = parseInt(idMatch[1], 10);

        const priceVal = item.price;
        if (!priceVal) continue;
        const price = parseFloat(priceVal.units) + (priceVal.nanos ? priceVal.nanos / 1e9 : 0);

        const title = item.displayName && item.displayName[0] ? item.displayName[0].value : null;

        const updateData: any = { price };
        if (title) updateData.title = title;

        const { data, error } = await supabase
          .from("menu_items")
          .update(updateData)
          .eq("id", dbId)
          .select();

        if (error) {
          console.error(`[Import] Failed to update item ${dbId}:`, error.message);
        } else if (data && data.length > 0) {
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

/**
 * POST Handler: Pushes the local database menu to Google.
 */
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

    // Generate a fresh access token server-side using the refresh token flow
    let accessToken: string;
    try {
      accessToken = await getGoogleAccessToken();
    } catch (authError: any) {
      return NextResponse.json(
        { error: "Google Authentication failed", details: authError.message },
        { status: 401 }
      );
    }

    const locationId = "4190813937772677288";
    const googlePayload = transformToGoogleFoodMenu(items);
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/foodMenus`;

    const response = await fetch(googleApiUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
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
          googleError: errorData 
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: "Menu successfully synchronized with Google Business Profile.",
      locationId,
      googleResponse: data,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
