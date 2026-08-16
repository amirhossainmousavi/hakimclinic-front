import type { Tariff } from "@/features/tariffs/types";

const TARIFF_DEFS: Array<{
  itemCode: string;
  itemDescription: string;
  price: number;
  description: string;
}> = [
  { itemCode: "TRF-1001", itemDescription: "پره متحرک تیتانیومی", price: 3_200_000, description: "برای پروتز زیر زانو" },
  { itemCode: "TRF-1002", itemDescription: "مفصل زانوی هیدرولیک", price: 38_000_000, description: "پلی‌سنتریک" },
  { itemCode: "TRF-1003", itemDescription: "سوکت اکریلیک استاندارد", price: 6_500_000, description: "ساخته‌شده از رزین" },
  { itemCode: "TRF-1004", itemDescription: "لاینر ژل سیلیکونی", price: 12_000_000, description: "ضدحساسیت" },
  { itemCode: "TRF-1005", itemDescription: "پره کربنی تیبل", price: 15_500_000, description: "انعطاف‌پذیر انرژی‌بازگشتی" },
  { itemCode: "TRF-1006", itemDescription: "قطعه چرخشی (Rotator)", price: 7_800_000, description: "برای چرخش پروتز" },
  { itemCode: "TRF-1007", itemDescription: "مفصل مچ پا با فنر", price: 4_900_000, description: "برای AFO" },
  { itemCode: "TRF-1008", itemDescription: "پوشش فوم کیهزی", price: 1_400_000, description: "رنگ پوست" },
  { itemCode: "TRF-1009", itemDescription: "گارتر کمربند شانه", price: 850_000, description: "قابل تنظیم" },
  { itemCode: "TRF-1010", itemDescription: "کفش مخصوص پروتز", price: 2_300_000, description: "با زیره ضدلغزش" },
  { itemCode: "TRF-1011", itemDescription: "انگشتان سیلیکونی دست", price: 5_200_000, description: "قطعه‌ای" },
  { itemCode: "TRF-1012", itemDescription: "واحد چرخشی زانو", price: 9_400_000, description: "چندمحوره" },
  { itemCode: "TRF-1013", itemDescription: "سوکت ملاک‌بند (Suspension)", price: 2_700_000, description: "سیستم تعلیق" },
  { itemCode: "TRF-1014", itemDescription: "مفصل بالای زانو قفل‌شونده", price: 21_000_000, description: "با قفل دستی" },
  { itemCode: "TRF-1015", itemDescription: "کف سیلیکونی آوولژن", price: 1_100_000, description: "جاذب شوک" },
  { itemCode: "TRF-1016", itemDescription: "پمپ خلأ برای سوکت", price: 4_300_000, description: "سیستم تعلیق خلأ" },
  { itemCode: "TRF-1017", itemDescription: "لایه ضدباکتری", price: 1_950_000, description: "با نقره" },
  { itemCode: "TRF-1018", itemDescription: "مفصل مچ دست چرخان", price: 6_700_000, description: "برای پروتز ساعد" },
  { itemCode: "TRF-1019", itemDescription: "دست کیهزی کودک", price: 8_900_000, description: "سایز کوچک" },
  { itemCode: "TRF-1020", itemDescription: "پره فشرده‌سازی چوب", price: 4_600_000, description: "فنری استاندارد" },
];

export const tariffsFixture: Tariff[] = TARIFF_DEFS.map((t, i) => ({
  id: `trf-${i + 1}`,
  itemCode: t.itemCode,
  itemDescription: t.itemDescription,
  price: t.price,
  description: t.description,
  createdAt: new Date(2025, 3, 1 + i).toISOString(),
}));
