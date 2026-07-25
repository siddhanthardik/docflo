interface CurrencyUnits {
  majorSingular: string;
  majorPlural: string;
  minorSingular: string;
  minorPlural: string;
  useIndianSystem?: boolean;
}

const CURRENCY_UNITS_MAP: Record<string, CurrencyUnits> = {
  INR: { majorSingular: "Rupee", majorPlural: "Rupees", minorSingular: "Paisa", minorPlural: "Paise", useIndianSystem: true },
  USD: { majorSingular: "Dollar", majorPlural: "Dollars", minorSingular: "Cent", minorPlural: "Cents" },
  EUR: { majorSingular: "Euro", majorPlural: "Euros", minorSingular: "Cent", minorPlural: "Cents" },
  GBP: { majorSingular: "Pound", majorPlural: "Pounds", minorSingular: "Penny", minorPlural: "Pence" },
  AED: { majorSingular: "Dirham", majorPlural: "Dirhams", minorSingular: "Fil", minorPlural: "Fils" },
  SAR: { majorSingular: "Riyal", majorPlural: "Riyals", minorSingular: "Halala", minorPlural: "Halalas" },
  CAD: { majorSingular: "Dollar", majorPlural: "Dollars", minorSingular: "Cent", minorPlural: "Cents" },
  AUD: { majorSingular: "Dollar", majorPlural: "Dollars", minorSingular: "Cent", minorPlural: "Cents" },
  SGD: { majorSingular: "Dollar", majorPlural: "Dollars", minorSingular: "Cent", minorPlural: "Cents" },
  QAR: { majorSingular: "Riyal", majorPlural: "Riyals", minorSingular: "Dirham", minorPlural: "Dirhams" },
  OMR: { majorSingular: "Rial", majorPlural: "Rials", minorSingular: "Baisa", minorPlural: "Baisa" },
  KWD: { majorSingular: "Dinar", majorPlural: "Dinars", minorSingular: "Fil", minorPlural: "Fils" },
  BHD: { majorSingular: "Dinar", majorPlural: "Dinars", minorSingular: "Fil", minorPlural: "Fils" },
};

export function numberToWords(num: number, currencyCode: string = "INR"): string {
  const code = (currencyCode || "INR").toUpperCase();
  const units = CURRENCY_UNITS_MAP[code] || CURRENCY_UNITS_MAP["INR"];

  if (isNaN(num) || num === 0) {
    return `Zero ${units.majorPlural} Only`;
  }

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWordsIndian(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWordsIndian(n % 100) : "");
    if (n < 100000) return inWordsIndian(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWordsIndian(n % 1000) : "");
    if (n < 10000000) return inWordsIndian(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWordsIndian(n % 100000) : "");
    return inWordsIndian(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWordsIndian(n % 10000000) : "");
  }

  function inWordsInternational(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWordsInternational(n % 100) : "");
    if (n < 1000000) return inWordsInternational(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWordsInternational(n % 1000) : "");
    if (n < 1000000000) return inWordsInternational(Math.floor(n / 1000000)) + " Million" + (n % 1000000 !== 0 ? " " + inWordsInternational(n % 1000000) : "");
    return inWordsInternational(Math.floor(n / 1000000000)) + " Billion" + (n % 1000000000 !== 0 ? " " + inWordsInternational(n % 1000000000) : "");
  }

  const converter = units.useIndianSystem ? inWordsIndian : inWordsInternational;

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const majorUnit = integerPart === 1 ? units.majorSingular : units.majorPlural;
  let words = (num < 0 ? "Minus " : "") + (integerPart > 0 ? converter(integerPart) : "Zero") + " " + majorUnit;

  if (decimalPart > 0) {
    const minorUnit = decimalPart === 1 ? units.minorSingular : units.minorPlural;
    words += " and " + converter(decimalPart) + " " + minorUnit;
  }

  return words + " Only";
}
