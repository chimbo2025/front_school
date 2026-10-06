export interface SchoolConfig {
  name: string;
  shortName: string;
  tagline: string;
  phone: string;
  altPhone: string;
  email: string;
  location: string;
  island: string;
  country: string;
  currency: string;
  academicYears: string[];
  motto: string;
  establishedYear: number;
}

export const schoolConfig: SchoolConfig = {
  name: "SEA COAST ACADEMY",
  shortName: "SEA COAST ACADEMY",
  tagline: "Empowering Future Leaders",
  phone: "0778 407 818",
  altPhone: "0777 123 456",
  email: "admissions@seacoastacademy.sc.tz",
  location: "Chukwani Main Road",
  island: "Unguja, Zanzibar",
  country: "Tanzania",
  currency: "Tsh",
  academicYears: ["2026/2027", "2025/2026"],
  motto: "Knowledge, Character, Innovation",
  establishedYear: 2012,
};

/**
 * Format currency amount to TZS representation, e.g. "1,925,000 Tsh"
 */
export function formatTsh(amount: number): string {
  const formattedNumber = new Intl.NumberFormat('en-US').format(amount);
  return `${formattedNumber} ${schoolConfig.currency}`;
}

/**
 * Format plain number with commas
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}
