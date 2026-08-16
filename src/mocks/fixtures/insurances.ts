import type { Insurance } from "@/features/insurances/types";

const NAMES = [
  "تأمین اجتماعی", "سلامت", "آتیه‌سازان حافظ", "پارسیان",
  "ایرانیان", "رازی", "کوثر", "دی",
];

export const insurancesFixture: Insurance[] = NAMES.map((name, i) => ({
  id: `ins-${i + 1}`,
  name,
  isApproved: i < 5,
  createdAt: new Date(2024, 6, 1 + i).toISOString(),
}));
