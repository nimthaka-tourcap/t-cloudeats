import { MenuItem } from "@/types/menu";
import { GoogleFoodMenusPayload, GoogleMenuSection, GoogleMenuItem } from "@/types/google-menu";

export const GOOGLE_LOCATION_ID = "4190813937772677288";

export function transformToGoogleFoodMenu(
  dbItems: Array<Pick<MenuItem, "id" | "title" | "price" | "category" | "description"> | any>
): GoogleFoodMenusPayload {
  const categoriesMap = new Map<string, any[]>();

  dbItems.forEach((item) => {
    const category = item.category || "General";
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category)!.push(item);
  });

  const sections: GoogleMenuSection[] = Array.from(categoriesMap.entries()).map(
    ([categoryName, items]) => {
      const sectionId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");

      const googleItems: GoogleMenuItem[] = items.map((item) => ({
        itemId: `item_${item.id}`,
        displayName: [{ languageCode: "en-US", value: item.title }],
        description: item.description
          ? [{ languageCode: "en-US", value: item.description }]
          : undefined,
        price: {
          currencyCode: "LKR",
          units: Math.floor(Number(item.price)).toString(),
          nanos: Math.round((Number(item.price) % 1) * 1e9),
        },
      }));

      return {
        sectionId,
        displayName: [{ languageCode: "en-US", value: categoryName }],
        items: googleItems,
      };
    }
  );

  return {
    menus: [
      {
        menuId: "t_cloud_eats_menu",
        displayName: [{ languageCode: "en-US", value: "T-Cloud Eats Main Menu" }],
        sections,
      },
    ],
  };
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials in environment variables.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

export async function getGoogleAccountId(accessToken: string): Promise<string> {
  const response = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
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
