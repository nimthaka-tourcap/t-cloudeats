import { supabase } from "./supabase";
import {
  GOOGLE_LOCATION_ID,
  getGoogleAccessToken,
  getGoogleAccountId,
  transformToGoogleFoodMenu,
} from "./services/google-menu-service";

export async function syncMenuAcrossPlatforms() {
  console.log("[Sync] Starting platform-wide menu synchronization...");

  try {
    const { data: dbItems, error } = await supabase
      .from("tce_menu_items")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    if (!dbItems || dbItems.length === 0) {
      console.log("[Sync] No menu items found in database. Skipping sync.");
      return;
    }

    try {
      const accessToken = await getGoogleAccessToken();
      const accountId = await getGoogleAccountId(accessToken);
      const googlePayload = transformToGoogleFoodMenu(dbItems);
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
        const errData = await response.json().catch(() => ({}));
        console.error("[Sync] Google API returned error:", response.status, errData);
      } else {
        console.log("[Sync] Google Business Profile menu synced successfully.");
      }
    } catch (googleError) {
      console.error("[Sync] Failed to sync with Google:", googleError);
    }
  } catch (error) {
    console.error("[Sync] Error in syncMenuAcrossPlatforms:", error);
  }
}
