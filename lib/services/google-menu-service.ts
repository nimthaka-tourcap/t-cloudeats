import { MenuItem } from "@/types/menu";
import { GoogleFoodMenusPayload, GoogleMenuSection, GoogleMenuItem } from "@/types/google-menu";

export function transformToGoogleFoodMenu(dbItems: MenuItem[]): GoogleFoodMenusPayload {
  const categoriesMap = new Map<string, MenuItem[]>();

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
