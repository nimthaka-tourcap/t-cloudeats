const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Disable SSL certificate validation for the script
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Custom zero-dependency .env loader
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env file:", e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function transformToGoogleFoodMenu(dbItems) {
  const categoriesMap = new Map();
  dbItems.forEach((item) => {
    const category = item.category || "General";
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category).push(item);
  });

  const sections = Array.from(categoriesMap.entries()).map(([categoryName, items]) => {
    const sectionId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    const googleItems = items.map((item) => {
      const itemId = `item_${item.id}`;
      
      return {
        itemId,
        displayName: [
          {
            languageCode: "en-US",
            value: item.title,
          },
        ],
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

async function getGoogleAccessToken() {
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

async function getGoogleAccountId(accessToken) {
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

async function run() {
  console.log("Fetching menu items from Supabase...");
  const { data: dbItems, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    process.exit(1);
  }

  if (!dbItems || dbItems.length === 0) {
    console.log("No menu items found.");
    process.exit(0);
  }

  console.log(`Loaded ${dbItems.length} menu items. Pushing to Google...`);

  try {
    const accessToken = await getGoogleAccessToken();
    const accountId = await getGoogleAccountId(accessToken);
    const locationId = "4190813937772677288";
    
    const googlePayload = transformToGoogleFoodMenu(dbItems);
    const googleApiUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/foodMenus`;

    console.log(`Sending PATCH request to ${googleApiUrl}...`);
    
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
      console.error("Google API returned error:", response.status, errData);
      process.exit(1);
    } else {
      console.log("Google Business Profile menu pushed and synced successfully!");
    }
  } catch (err) {
    console.error("Push failed:", err);
    process.exit(1);
  }
}

run();
