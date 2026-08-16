export interface Insurance {
  id: string;
  name: string;
  isApproved: boolean;
  createdAt: string;
}

export interface CreateInsuranceInput {
  name: string;
}

export const INSURANCE_NAMES = [
  "تأمین اجتماعی",
  "سلامت",
  "آتیه‌سازان حافظ",
  "پارسیان",
  "ایرانیان",
  "رازی",
  "کوثر",
  "دی",
];
