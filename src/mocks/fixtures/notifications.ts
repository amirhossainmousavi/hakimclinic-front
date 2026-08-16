import { faker } from "@faker-js/faker/locale/fa";
import type { Notification } from "@/features/notifications/types";

const MESSAGES = [
  "وضعیت سفارش محمد احمدی به «آماده تحویل» تغییر کرد",
  "تأییدیه بیمه فاطمه مرادی دریافت شد",
  "نوبت‌دهی فردا ساعت ۸ صبح شروع می‌شود",
  "یادآوری: تسویه فاکتور هفته گذشته",
  "بیمار جدید علی‌رضا نعمتی پذیرش شد",
  "سفارش پروتز شماره ۱۰۱۲ وارد مرحله ساخت شد",
  "بازبینی سهماهه اقلام انبار انجام شود",
  "اطلاعیه: تعطیلی کلینیک به مناسبت عید",
];

export const notificationsFixture: Notification[] = MESSAGES.map((msg, i) => ({
  id: `ntf-${i + 1}`,
  message: msg,
  createdAt: faker.date.recent({ days: 20 }).toISOString(),
  read: i < 5,
  createdByUserName: i % 2 === 0 ? "مدیر کلینیک" : "زهرا محمدی",
}));

// Today's announcement — for the secretary dashboard banner (mock of a real backend that needs a separate date field)
notificationsFixture.unshift({
  id: "ntf-today",
  message: "نوبت‌دهی امروز طبق روال عادی انجام می‌شود. یادآوری: بازبینی وضعیت بیماران در انتظار تاییدیه بیمه.",
  createdAt: new Date().toISOString(),
  read: false,
  createdByUserName: "مدیر کلینیک",
});
