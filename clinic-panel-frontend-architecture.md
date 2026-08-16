# سند معماری فرانت‌اند — پنل مدیریت کلینیک ارتوپدی فنی حکیم

> وضعیت فعلی پیاده‌سازی؛ مرجع ایجنت کدنویس. بخش‌های `[TODO]` موارد باز هستند.

---

## ۱. خلاصه استک

| بخش | تصمیم |
|---|---|
| فریم‌ورک | Next.js 16 (App Router)، رویکرد **Client-First** |
| زبان | TypeScript |
| استایل | Tailwind CSS 4 |
| دیزاین سیستم پایه | shadcn/ui (روی Radix) — سفارشی‌سازی‌شده |
| مدیریت داده/سرور استیت | TanStack Query |
| مدیریت فرم | React Hook Form + Zod |
| Mock API | MSW (با `NEXT_PUBLIC_USE_MOCK=true`) |
| PWA | Serwist (`@serwist/next`) |
| جهت | RTL کامل، فونت Vazirmatn |

**چرا Client-First روی App Router:** پنل پشت لاگین است و SEO موضوعیت ندارد. تقریباً همه‌چیز `'use client'` است؛ داده از طریق TanStack Query در سمت کلاینت گرفته می‌شود. از ساختار فایل‌محور App Router فقط برای روتینگ و layout استفاده می‌شود.

---

## ۲. ساختار پوشه‌ها

```
src/
  app/
    (auth)/login/page.tsx
    (dashboard)/
      layout.tsx              # Sidebar + Header
      dashboard/page.tsx
      patients/page.tsx
      appointments/page.tsx
      invoices/page.tsx
      insurances/page.tsx
      services/page.tsx
      tariffs/page.tsx
      reports/revenue/page.tsx
      expenses/page.tsx
      secretaries/page.tsx
      notifications/page.tsx
      settings/page.tsx
    favicon.ico               # آیکون برند (جایگزین پیش‌فرض Next.js)
    icon.svg                  # آیکون برند برای App Router metadata
    manifest.ts               # Web App Manifest (Serwist)
    sw.ts                     # Service Worker (Serwist)
    layout.tsx                # dir="rtl"، فونت، Providers
  components/
    ui/                       # shadcn/ui primitives
    design-system/            # کامپوننت‌های اختصاصی کلینیک (StatusBadge, StatCard, ...)
    skeletons/                # Skeleton به‌ازای هر صفحه
  features/<module>/
    api.ts                    # فراخوانی‌های endpoint (از api-client)
    hooks.ts                  # useQuery / useMutation
    types.ts                  # تایپ‌ها منطبق با پاسخ بک‌اند
    + کامپوننت‌های ویژه ماژول
  lib/
    api-client.ts             # wrapper مرکزی fetch + مدیریت خطا + توکن + refresh
    api-error.ts              # کلاس ApiError
    auth.ts                   # توکن‌ها / جلسه
    query-client.ts           # تنظیمات TanStack Query
    jalali.ts                 # توابع تاریخ شمسی
    roles.ts                  # نقش‌ها و دسترسی‌ها
    types.ts                  # تایپ‌های مشترک
    utils.ts                  # توابع کمکی (مثلاً toEnglishDigits)
  mocks/
    handlers/                 # یک فایل handler به‌ازای هر ماژول
    fixtures/                 # داده نمونه (faker)
    browser.ts                # setup MSW برای مرورگر
  styles/globals.css
```

قانون سخت: **کامپوننت صفحه هرگز مستقیم `fetch` صدا نمی‌زند.** همیشه از `features/<module>/hooks.ts` (که از `api.ts` و `lib/api-client.ts` استفاده می‌کند).

---

## ۳. الگوی داده‌گیری

صفحات از الگوی mount → Skeleton → `useQuery` → جایگزینی محتوا پیروی می‌کنند:

```tsx
export default function PatientsPage() {
  const { data, isLoading, isError } = usePatientsList(filters);
  if (isLoading) return <PatientsListSkeleton />;
  if (isError) return <ErrorState />;
  return <PatientsList data={data} />;
}
```

---

## ۴. Mock API (MSW)

- درخواست‌های `fetch` در سطح شبکه intercept می‌شوند؛ کامپوننت‌ها و هوک‌ها نمی‌دانند mock هستند یا بک‌اند واقعی.
- پیمان پاسخ دقیقاً منطبق با بک‌اند: موفق `{ success: true, data, meta }` / خطا `{ success: false, error: { code, message, details } }`.
- هر handler مسیر دقیقاً برابر endpoint واقعی دارد (`/api/v1/...`) و یک تاخیر مصنوعی (۳۰۰-۸۰۰ms) تا رفتار Skeleton واقعی تست شود.
- فعال/غیرفعال از طریق `NEXT_PUBLIC_USE_MOCK` در `lib/api-client.ts` (پیش‌فرض `false`).

---

## ۵. دیزاین سیستم — کلینیک ارتوپدی فنی

### رنگ (CSS Variables، سازگار با shadcn theming)
| توکن | نقش |
|---|---|
| `--primary` | رنگ اصلی برند — آبی-تیل ملایم (teal-700) |
| `--primary-foreground` | متن روی primary |
| `--secondary` | خاکستری گرم پس‌زمینه ثانویه |
| `--accent` | جزئیات/هاور |
| `--destructive` | خطا/حذف |
| `--success` | موفقیت/تحویل‌شده |
| `--warning` | در انتظار |

### رنگ وضعیت بیمار (badge اختصاصی)
| وضعیت | رنگ |
|---|---|
| در انتظار تاییدیه بیمه | زرد کهربایی |
| در حال ساخت | آبی |
| آماده تحویل | بنفش |
| تحویل داده شده | سبز |

### تایپوگرافی و فاصله
- فونت **Vazirmatn** (variable، پشتیبانی اعداد فارسی)
- مقیاس ۸ پیکسلی؛ گوشه‌گرد `rounded-2xl` کارت‌ها و `rounded-lg` دکمه/اینپوت؛ سایه‌های نرم.

### کامپوننت‌های اختصاصی (`components/design-system/`)
`StatCard`, `StatusBadge`, `EmptyState`, `ErrorState`, `PageHeader` و سایر کامپوننت‌های کلینیکی.

### واکنش‌گرا
Sidebar در موبایل به Drawer تبدیل می‌شود؛ جدول‌ها در موبایل به کارت‌های عمودی؛ فرم‌ها تک‌ستونه در موبایل، دوستونه در دسکتاپ.

---

## ۶. RTL و بومی‌سازی

- `<html dir="rtl" lang="fa">` در `app/layout.tsx`
- Tailwind فقط با Logical Properties (`ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`)
- آیکون‌های جهت‌دار با `rtl:` variant یا transform معکوس
- تاریخ‌ها شمسی (jalali) در فرم‌ها و نمایش‌ها — توابع در `lib/jalali.ts`

---

## ۷. PWA — Serwist

- `app/manifest.ts` (نام، آیکون‌ها، `theme_color`)
- Precache در build؛ Runtime caching برای تصاویر (`stale-while-revalidate`) و پاسخ‌های GET API (`network-first`)
- داده‌های حساس (فاکتور، بیمار) کش نمی‌شوند مگر برای مشاهده صرف؛ حالت offline-write وجود ندارد.

---

## ۸. نگاشت صفحه → ماژول بک‌اند

| صفحه | ماژول بک‌اند |
|---|---|
| داشبورد | `GET /dashboard` |
| بیماران / پذیرش | `patients` + `files` (آپلود فایل پرونده) |
| تقویم نوبت‌دهی | `appointments` |
| فاکتور | `invoices` |
| بیمه‌ها | `insurances` |
| خدمات / تعرفه‌ها | `services` / `tariffs` |
| گزارش درآمد | `reports/revenue` |
| هزینه‌ها | `expenses` |
| منشی‌ها | `secretaries` + `admission-places` |
| اطلاعیه‌ها | `notifications` |
| تنظیمات | پروفایل کاربر |

دسترسی صفحه: نقش و دسترسی‌ها از `lib/roles.ts` (پس از decode توکن) خوانده می‌شود؛ بدون دسترسی → ریدایرکت به داشبورد.

---

## ۹. مدیریت خطا در فرانت

- `lib/api-client.ts` هر پاسخ `success:false` را به `ApiError` تبدیل می‌کند (شامل `code`, `message`).
- ۴۰۱ → یک‌بار تلاش خودکار refresh → در صورت شکست ریدایرکت به `/login`.
- خطاهای validation → نگاشت `details` به فیلدهای فرم React Hook Form.
- خطاهای غیرمنتظره → `ErrorState` عمومی + تلاش مجدد (invalidate همان query).
- Toast سراسری (sonner) برای موفقیت عملیات‌های نوشتنی.

---

## ۱۰. امنیت و پیکربندی

- **حساب‌های دمو:** فقط با `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true` روی صفحه ورود نمایش داده می‌شوند (opt-in؛ پیش‌فرض `false`). اعتبار آنها عمومی است، پس در production نباید فعال شوند.
- **فایل‌های محلی:** URL های `/uploads/...` با append کردن توکن access (`?token=`) سرو می‌شوند.
- `.env.example` مرجع همه متغیرهای محیطی است؛ `.env.local` و فایل‌های `.env*` در git نیستند.

---

## ۱۱. موارد باز `[TODO]`

1. انتخاب نهایی کتابخانه/روش تقویم شمسی (فعلاً `lib/jalali.ts` دستی).
2. آیکن‌ست نهایی (لازم است؟).
3. تنظیم `manifest.ts` و آیکون‌های PWA برای دامنه production واقعی.
