export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee (INR - ₹)" },
  { code: "USD", symbol: "$", name: "US Dollar (USD - $)" },
  { code: "EUR", symbol: "€", name: "Euro (EUR - €)" },
  { code: "GBP", symbol: "£", name: "British Pound (GBP - £)" },
  { code: "AED", symbol: "AED", name: "UAE Dirham (AED)" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal (SAR)" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar (CAD - CA$)" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar (AUD - A$)" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar (SGD - S$)" },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal (QAR)" },
  { code: "OMR", symbol: "OMR", name: "Omani Rial (OMR)" },
  { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar (KWD)" },
  { code: "BHD", symbol: "BHD", name: "Bahraini Dinar (BHD)" },
];

export function getCurrencySymbol(currencyCode?: string | null): string {
  if (!currencyCode) return "$";
  const found = SUPPORTED_CURRENCIES.find(
    (c) => c.code.toUpperCase() === currencyCode.toUpperCase()
  );
  return found ? found.symbol : currencyCode;
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode?: string | null
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount || 0;
  if (isNaN(num)) return `${getCurrencySymbol(currencyCode)}0`;
  const sym = getCurrencySymbol(currencyCode);
  return `${sym}${num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
