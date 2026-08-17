import type { Service } from "@/features/services/types";

const SERVICE_DEFS: Array<{
  serviceType: Service["serviceType"];
  serviceName: string;
  serviceCode: string;
  price: number;
  description: string;
}> = [
  { serviceType: "orthosis", serviceName: "طراحی و ساخت کف طبی", serviceCode: "ORT-101", price: 1_500_000, description: "کف طبی متناسب با قوس کف پا" },
  { serviceType: "orthosis", serviceName: "ساخت قوزبند طبی", serviceCode: "ORT-102", price: 2_800_000, description: "با قابلیت تنظیم فشار" },
  { serviceType: "orthosis", serviceName: "ساخت گردنبند طبی", serviceCode: "ORT-103", price: 950_000, description: "شبیه‌ساز ستون فقرات گردنی" },
  { serviceType: "orthosis", serviceName: "ساخت زانوبند طبی", serviceCode: "ORT-104", price: 3_500_000, description: "مفصل‌دار، قابل تنظیم زاویه" },
  { serviceType: "orthosis", serviceName: "ساخت مچ‌بند طبی", serviceCode: "ORT-105", price: 780_000, description: "برای مچ دست و مچ پا" },
  { serviceType: "orthosis", serviceName: "ساخت بریس ستون فقرات (TLSO)", serviceCode: "ORT-106", price: 12_000_000, description: "سفارشی بر اساس قالب‌گیری" },
  { serviceType: "orthosis", serviceName: "ساخت مچ‌پای طبی (AFO)", serviceCode: "ORT-107", price: 4_200_000, description: "از جنس پلی‌پروپیلن" },
  { serviceType: "orthosis", serviceName: "ساخت آرنج‌بند طبی", serviceCode: "ORT-108", price: 1_100_000, description: "با نوار الاستیک" },
  { serviceType: "orthosis", serviceName: "ساخت شانه‌بند طبی", serviceCode: "ORT-109", price: 1_350_000, description: "برای بی‌حرکتی کمربند شانه" },
  { serviceType: "orthosis", serviceName: "ساخت کفش طبی مخصوص", serviceCode: "ORT-110", price: 5_600_000, description: "دست‌ساز، با روکش چرم" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز زیر زانو (Transtibial)", serviceCode: "PRO-201", price: 45_000_000, description: "با سوکت سفارشی" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز بالای زانو (Transfemoral)", serviceCode: "PRO-202", price: 85_000_000, description: "با مفصل هیدرولیک" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز بازو", serviceCode: "PRO-203", price: 38_000_000, description: "کوزمتیک و عملکردی" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز ساعد", serviceCode: "PRO-204", price: 26_000_000, description: "با قلاب یا دست کیهزی" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز انگشت", serviceCode: "PRO-205", price: 8_500_000, description: "سیلیکونی کیهزی" },
  { serviceType: "prosthesis", serviceName: "تعویض سوکت پروتز", serviceCode: "PRO-206", price: 15_000_000, description: "قالب‌گیری مجدد و ساخت سوکت" },
  { serviceType: "orthosis", serviceName: "ساخت کفی طبی سیلیکونی", serviceCode: "ORT-111", price: 2_200_000, description: "ژل سیلیکونی" },
  { serviceType: "orthosis", serviceName: "ساخت کف طبی دیابتی", serviceCode: "ORT-112", price: 3_100_000, description: "کفش‌های دیابتی" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز فمورال کانادایی", serviceCode: "PRO-207", price: 95_000_000, description: "برای قطع اندام تا سطح لگن" },
  { serviceType: "prosthesis", serviceName: "ساخت دست بیونیک", serviceCode: "PRO-208", price: 120_000_000, description: "با کنترل میوالکتریک" },
  { serviceType: "orthosis", serviceName: "ساخت مینیسک‌بند زانو", serviceCode: "ORT-113", price: 2_600_000, description: "حمایتی پس از عمل" },
  { serviceType: "orthosis", serviceName: "ساخت ساپورت قوس کف پا", serviceCode: "ORT-114", price: 1_850_000, description: "قوس داخلی و خارجی" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز ترانس‌رادیال", serviceCode: "PRO-209", price: 32_000_000, description: "بعد از قطع ساعد" },
  { serviceType: "orthosis", serviceName: "ساخت بند حمایتی مچ دست", serviceCode: "ORT-115", price: 690_000, description: "مچ‌بند سبک روزانه" },
  { serviceType: "prosthesis", serviceName: "ساخت پروتز انگشتان دست", serviceCode: "PRO-210", price: 9_800_000, description: "دست کیهزی جزئی" },
];

export const servicesFixture: Service[] = SERVICE_DEFS.map((s, i) => ({
  id: `svc-${i + 1}`,
  serviceType: s.serviceType,
  serviceName: s.serviceName,
  regionOrSection: null,
  treatmentProcess: null,
  serviceCode: s.serviceCode,
  price: s.price,
  description: s.description,
  createdAt: new Date(2025, 1, 1 + i).toISOString(),
}));
