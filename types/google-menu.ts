export interface GoogleMoney {
  currencyCode: string;
  units: string;
  nanos?: number;
}

export interface GoogleText {
  languageCode: string;
  value: string;
}

export interface GoogleMenuItem {
  itemId: string;
  displayName: GoogleText[];
  description?: GoogleText[];
  price?: GoogleMoney;
}

export interface GoogleMenuSection {
  sectionId: string;
  displayName: GoogleText[];
  items: GoogleMenuItem[];
}

export interface GoogleMenu {
  menuId: string;
  displayName: GoogleText[];
  sections: GoogleMenuSection[];
}

export interface GoogleFoodMenusPayload {
  name?: string;
  menus: GoogleMenu[];
}
