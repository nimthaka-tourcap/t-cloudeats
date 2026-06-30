import { NextResponse } from "next/server";

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
