import { supabase } from "./supabase";

interface GoogleMoney {
  currencyCode: string;
  units: string;
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

/**
 * Transforms database items to Google Food Menu format.
 */
export function transformToGoogleFoodMenu(dbItems: any[]): GoogleFoodMenusPayload {
  const categoriesMap = new Map<string, any[]>();
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
          units: Math.floor(Number(item.price)).toString(),
          nanos: Math.round((Number(item.price) % 1) * 1e9),
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
 * Refreshes and retrieves a Google OAuth Access Token.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials in environment variables.");
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
 * Automatically discovers the Google Business account ID.
 */
export async function getGoogleAccountId(accessToken: string): Promise<string> {
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

  // Extract accountId from "accounts/{accountId}"
  const accountName = data.accounts[0].name;
  return accountName.split("/")[1];
}

/**
 * Synchronizes the menu with all third-party channels.
 */
export async function syncMenuAcrossPlatforms() {
  console.log("[Sync] Starting platform-wide menu synchronization...");

  try {
    // 1. Fetch the latest menu items from the Supabase database
    const { data: dbItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    if (!dbItems || dbItems.length === 0) {
      console.log("[Sync] No menu items found in database. Skipping sync.");
      return;
    }

    // 2. Synchronize with Google Business Profile
    try {
      const accessToken = await getGoogleAccessToken();
      const accountId = await getGoogleAccountId(accessToken);
      const locationId = "4190813937772677288";
      
      const googlePayload = transformToGoogleFoodMenu(dbItems);
      const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/foodMenus`;

      console.log(`[Sync] Syncing ${dbItems.length} items to Google location ${locationId}...`);
      
      const response = await fetch(googleApiUrl, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googlePayload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[Sync] Google API returned error:", response.status, errData);
      } else {
        console.log("[Sync] Google Business Profile menu synced successfully.");
      }
    } catch (googleError) {
      console.error("[Sync] Failed to sync with Google:", googleError);
    }

    // 3. (Future Channel) PickMe Sync Hook
    console.log("[Sync] PickMe channel placeholder ready.");

    // 4. (Future Channel) Uber Eats Sync Hook
    console.log("[Sync] Uber Eats channel placeholder ready.");

  } catch (error) {
    console.error("[Sync] Error in syncMenuAcrossPlatforms:", error);
  }
}
