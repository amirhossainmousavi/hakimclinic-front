# سند معماری فرانت‌اند — پنل مدیریت کلینیک ارتوپدی فنی حکیم

> این سند برای دست‌یابی مستقیم ایجنت کدنویس تهیه شده. مکمل سند `clinic-panel-backend-architecture.md` است و هر endpoint در اینجا دقیقاً بر همان قرارداد تکیه دارد.

---

## ۱. خلاصه استک

| بخش | تصمیم |
|---|---|
| فریم‌ورک | Next.js (App Router)، رویکرد **Client-First** |
| زبان | TypeScript |
| استایل | Tailwind CSS |
| دیزاین سیستم پایه | shadcn/ui (روی Radix) — کاملاً سفارشی‌سازی‌شده |
| مدیریت داده/سرور استیت | TanStack Query (React Query) |
| مدیریت فرم | React Hook Form + Zod (هم‌راستا با اعتبارسنجی بک‌اند) |
| Mock API | MSW (Mock Service Worker) |
| PWA | Serwist (`@serwist/next`) |
| تقویم | کتابخانه شمسی (jalali) — `[TODO: انتخاب نهایی بین react-multi-date-picker یا shamsi-date، بسته به سازگاری با shadcn]` |
| جهت | RTL کامل، فونت Vazirmatn |

**چرا Client-First روی App Router:** پنل پشت لاگین است و SEO موضوعیت ندارد. مزیت اصلی Server Component (رندر سمت سرور برای سئو/سرعت اولین بار) اینجا کاربرد ندارد؛ در عوض الگوی درخواستی («mount شدن صفحه → Skeleton → فراخوانی API») دقیقاً مدل داده‌گیری سمت کلاینت (Client-side fetching) است، نه مدل RSC. بنابراین از ساختار فایل‌محور App Router برای روتینگ/layout استفاده می‌شود ولی تقریباً همه‌چیز `'use client'` است و داده از طریق TanStack Query گرفته می‌شود.

---

## ۲. ساختار پوشه‌ها

```
src/
  app/
    (auth)/
      login/page.tsx
    (dashboard)/
      layout.tsx              # شامل Sidebar + Header + نوار پیشرفت ناوبری
      dashboard/page.tsx
      patients/
        page.tsx
        [id]/page.tsx
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
    manifest.ts                # Web App Manifest (Serwist)
    sw.ts                      # Service Worker (Serwist)
    layout.tsx                 # RootLayout — dir="rtl", فونت، Providers
  components/
    ui/                        # shadcn/ui primitives (سفارشی‌سازی‌شده)
    design-system/             # کامپوننت‌های اختصاصی کلینیک (StatusBadge, StatCard, ...)
    skeletons/                 # یک Skeleton به‌ازای هر صفحه
  features/
    patients/
      api.ts                   # فراخوانی‌های endpoint (fetch wrapper)
      hooks.ts                 # useQuery / useMutation hooks
      types.ts                 # تایپ‌های دقیقاً منطبق با پاسخ بک‌اند
    invoices/ ...
    (به ازای هر ماژول بک‌اند یک پوشه مشابه)
  lib/
    api-client.ts              # wrapper مرکزی fetch + مدیریت خطا + توکن
    query-client.ts             # تنظیمات TanStack Query
    jalali.ts                   # توابع کمکی تاریخ شمسی
  mocks/
    handlers/                   # یک فایل handler به‌ازای هر ماژول
    browser.ts                  # setup MSW برای مرورگر
  styles/
    globals.css
```

قانون سخت: **کامپوننت صفحه هرگز مستقیم `fetch` صدا نمی‌زند.** همیشه از طریق `features/<module>/hooks.ts` (که خودش از `api.ts` و `lib/api-client.ts` استفاده می‌کند).

---

## ۳. الگوی داده‌گیری و Skeleton (طبق خواسته دقیق کارفرما)

جریان اجباری برای **هر** صفحه:

```
۱. کاربر روی لینک کلیک می‌کند → نوار پیشرفت بالای صفحه (NProgress-style) شروع می‌شود
۲. صفحه مقصد mount می‌شود (بلافاصله، بدون منتظر ماندن برای داده)
۳. کامپوننت Skeleton مخصوص همان صفحه نمایش داده می‌شود (نه اسپینر ژنریک)
۴. useQuery مربوط به آن صفحه فراخوانی می‌شود
۵. با برگشت داده (isLoading=false)، Skeleton با محتوای واقعی جایگزین می‌شود؛ نوار پیشرفت کامل و محو می‌شود
```

نمونه ساختار یک صفحه:

```tsx
// app/(dashboard)/patients/page.tsx
'use client';
export default function PatientsPage() {
  const { data, isLoading, isError } = usePatientsList(filters);
  if (isLoading) return <PatientsListSkeleton />;
  if (isError) return <ErrorState />;
  return <PatientsList data={data} />;
}
```

**قانون طراحی Skeleton:** هر `XxxSkeleton.tsx` باید همان چیدمان صفحه واقعی (تعداد ستون جدول، اندازه کارت‌ها، تعداد ردیف‌های نمونه) را با بلوک‌های خاکستری pulse-animated بازتولید کند — کپی از کامپوننت واقعی با جایگزینی محتوا با `<Skeleton className="..." />`.

نوار پیشرفت ناوبری: با گوش‌دادن به رویدادهای روتر Next.js (`usePathname` + یک Provider سراسری) پیاده می‌شود، مستقل از TanStack Query.

---

## ۴. Mock API — قرارداد دقیقاً منطبق با بک‌اند

**ابزار: MSW (Mock Service Worker).** درخواست‌های `fetch` را در سطح شبکه intercept می‌کند؛ کامپوننت‌ها و هوک‌ها اصلاً نمی‌دانند mock هستند یا بک‌اند واقعی — یعنی وقتی هم‌روش آماده شد، فقط باید MSW غیرفعال شود، هیچ کد دیگری تغییر نمی‌کند.

**پیمان پاسخ (کپی دقیق از سند بک‌اند بخش ۶):**

موفق:
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 10, "total": 42 } }
```

خطا:
```json
{ "success": false, "error": { "code": "PATIENT_NOT_FOUND", "message": "...", "details": null } }
```

هر handler در `mocks/handlers/<module>.ts` باید:
- مسیر دقیقاً برابر endpoint واقعی (`/api/v1/patients`, ...) طبق سند بک‌اند بخش ۷ باشد
- تاخیر مصنوعی تصادفی (`300-800ms`) داشته باشد تا رفتار Skeleton واقعی تست شود
- برای حداقل یک سناریو در هر ماژول، حالت خطا (مثلاً `404`, `VALIDATION_ERROR`) هم شبیه‌سازی شود تا مسیر `isError` هم در توسعه دیده شود

فعال/غیرفعال بودن MSW از طریق متغیر محیطی: `NEXT_PUBLIC_USE_MOCK=true|false` در `lib/api-client.ts` بررسی می‌شود.

**داده نمونه:** برای بیمار، فاکتور، خدمات و تعرفه‌ها حداقل ۲۰-۳۰ رکورد fake (با `@faker-js/faker`، نام‌های فارسی) در `mocks/fixtures/` تولید شود تا صفحه‌بندی و جست‌وجو هم قابل تست باشد.

---

## ۵. دیزاین سیستم — کلینیک ارتوپدی فنی

### فلسفه
حس درمانی، آرام و قابل‌اعتماد؛ نه شلوغ، نه سرد و اداری. مدرن با فضای سفید کافی و کارت‌محور.

### رنگ (CSS Variables، سازگار با shadcn theming)
| توکن | نقش | مقدار پیشنهادی |
|---|---|---|
| `--primary` | رنگ اصلی برند | آبی-تیل ملایم `#0F766E`‑ish (teal-700) |
| `--primary-foreground` | متن روی primary | سفید |
| `--secondary` | خاکستری گرم پس‌زمینه ثانویه | `#F1F5F4` |
| `--accent` | جزئیات/هاور | teal روشن‌تر |
| `--destructive` | خطا/حذف | قرمز ملایم (نه قرمز تند) |
| `--success` | موفقیت/تحویل‌شده | سبز |
| `--warning` | در انتظار | زرد کهربایی |

### رنگ وضعیت بیمار (badge اختصاصی، جدا از رنگ سیستم)
| وضعیت | رنگ |
|---|---|
| در انتظار تاییدیه بیمه | زرد کهربایی |
| در حال ساخت | آبی |
| آماده تحویل | بنفش |
| تحویل داده شده | سبز |

### تایپوگرافی
- فونت: **Vazirmatn** (variable font، پشتیبانی کامل اعداد فارسی)
- مقیاس: `text-sm` برای جدول‌ها، `text-base` متن عمومی، `text-2xl/text-3xl` عناوین صفحه
- وزن: 400 متن عادی، 600 عناوین، 500 برچسب فرم

### فاصله‌گذاری و اشکال
- مقیاس ۸ پیکسلی (`gap-2, gap-4, gap-6, gap-8`)
- گوشه گرد: `rounded-2xl` برای کارت‌ها، `rounded-lg` برای دکمه/اینپوت
- سایه: نرم و کم‌رنگ (`shadow-sm` تا `shadow-md`)، بدون سایه‌های سنگین

### کامپوننت‌های اختصاصی طراحی (`components/design-system/`)
- `StatCard` — کارت آماری داشبورد (عدد بزرگ + آیکون + برچسب)
- `StatusBadge` — نشان رنگی وضعیت بیمار
- `PatientListItem` — ردیف بیمار با آواتار حرف اول نام، وضعیت، دکمه اکشن سریع
- `EmptyState` — حالت خالی هر لیست با تصویر/آیکون ساده و راهنما
- `ErrorState` — حالت خطا با دکمه تلاش مجدد
- `PageHeader` — عنوان صفحه + breadcrumb + دکمه اکشن اصلی صفحه (مثلاً «پذیرش بیمار جدید»)

### حالت واکنش‌گرا (Responsive)
- Sidebar: در دسکتاپ ثابت باز، در موبایل/تبلت به Drawer (کشویی) تبدیل می‌شود
- جدول‌ها: در موبایل به کارت‌های عمودی (Stacked Card) تبدیل می‌شوند، نه اسکرول افقی جدول
- فرم پذیرش/نوبت‌دهی: تک‌ستونه در موبایل، دوستونه در دسکتاپ

---

## ۶. RTL و بومی‌سازی

- `<html dir="rtl" lang="fa">` در `app/layout.tsx`
- کلاس‌های Tailwind فقط با Logical Properties: `ms-*`/`me-*` (نه `ml-*`/`mr-*`)، `ps-*`/`pe-*`, `start-*`/`end-*`
- آیکون‌های جهت‌دار (فلش بازگشت، chevron) باید با `rtl:` variant یا transform معکوس شوند
- اعداد: در جدول‌های مالی (مبلغ) از اعداد لاتین با جداکننده هزارگان استفاده شود (خوانایی بهتر در محاسبات)؛ در متن عادی از اعداد فارسی
- تقویم و تاریخ‌ها: شمسی (jalali) در تمام فرم‌ها و نمایش‌ها — `[TODO: نهایی‌سازی کتابخانه]`

---

## ۷. PWA — Serwist

- `app/manifest.ts`: نام اپ، آیکون‌ها (۱۹۲ و ۵۱۲ پیکسل)، `theme_color` برابر `--primary`، `display: standalone`
- Precache در زمان build: فونت‌ها (Vazirmatn woff2)، آیکون‌ها، shell اصلی اپ
- Runtime caching:
  - تصاویر بیمار/آواتار: `stale-while-revalidate`
  - پاسخ‌های GET API: `network-first` با fallback به کش (برای کارکرد نیمه‌آفلاین در نت ضعیف کلینیک)
- صفحه fallback آفلاین ساده (`/~offline`) برای وقتی که هیچ کشی هم موجود نیست
- توجه: داده‌های حساس (فاکتور، اطلاعات بیمار) کش نمی‌شوند مگر برای مشاهده صرف؛ هیچ حالت offline-write (نوشتن آفلاین) در فاز اول پیاده نمی‌شود.

---

## ۸. نگاشت صفحات به نقش‌ها و Endpoint ها

| صفحه | نقش‌های مجاز | Endpoint اصلی (سند بک‌اند بخش ۷) |
|---|---|---|
| داشبورد | هر سه نقش (محتوا نقش‌محور) | `GET /dashboard` |
| لیست بیماران / پذیرش | هر سه نقش | `GET/POST /patients`, `PATCH /patients/:id/status` |
| تقویم نوبت‌دهی | منشی سطح۲ + مدیر | `GET/POST/PATCH/DELETE /appointments` |
| فاکتور | هر سه نقش | `POST /invoices`, `POST /invoices/pro-forma` |
| اطلاعیه | هر سه نقش (دریافت) / مدیر (ارسال) | `GET/POST /notifications` |
| مدیریت منشی‌ها | فقط مدیر | `GET/POST/PATCH/DELETE /secretaries` |
| بیمه‌ها | فقط مدیر | `GET/POST/PATCH /insurances` |
| خدمات | فقط مدیر | `GET/POST/PATCH/DELETE /services` |
| تعرفه‌ها | فقط مدیر | `GET/POST/PATCH/DELETE /tariffs` |
| گزارش درآمد | فقط مدیر | `GET /reports/revenue` |
| هزینه‌ها | منشی سطح۲ + مدیر | `GET/POST /expenses/*` |
| تنظیمات | هر سه نقش | `PATCH /settings/profile` |

کنترل دسترسی صفحه: یک `RoleGuard` سطح layout که نقش کاربر (از توکن JWT decode‌شده در کلاینت) را با لیست بالا چک می‌کند و در صورت نبود دسترسی، ریدایرکت به داشبورد.

---

## ۹. مدیریت خطا در فرانت

- `lib/api-client.ts` هر پاسخ `success:false` را به یک `ApiError` تبدیل می‌کند (شامل `code`, `message`).
- خطای ۴۰۱ (توکن منقضی) → تلاش خودکار refresh token → در صورت شکست، ریدایرکت به `/login`.
- خطاهای validation (`VALIDATION_ERROR`) → نگاشت `details` به فیلدهای فرم React Hook Form (`setError`).
- خطاهای غیرمنتظره → نمایش `ErrorState` عمومی + دکمه «تلاش مجدد» (که همان query را invalidate می‌کند).
- Toast سراسری (shadcn `sonner` یا `toast`) برای موفقیت عملیات‌های نوشتنی (ثبت، ویرایش، حذف).

---

## ۱۰. موارد باز `[TODO]`

1. انتخاب نهایی کتابخانه تقویم شمسی (سازگار با shadcn Popover).
2. آیکن‌ست نهایی (Lucide پیش‌فرض shadcn کافی است یا ست اختصاصی سفارش داده می‌شود؟).
3. دامنه production برای تنظیم `manifest.ts` و آیکون‌های PWA در سایزهای واقعی.

---

## ۱۱. اولویت پیاده‌سازی پیشنهادی برای ایجنت

1. Setup پروژه (Next.js + TS + Tailwind + shadcn init) + فونت + RTL + Layout پایه
2. `lib/api-client.ts` + MSW setup + یک ماژول نمونه کامل (patients) end-to-end شامل Skeleton
3. دیزاین سیستم پایه (توکن‌های رنگ/تایپوگرافی + کامپوننت‌های اختصاصی)
4. auth (صفحه لاگین + RoleGuard + مدیریت توکن)
5. تکمیل سایر ماژول‌ها به ترتیب اولویت سند بک‌اند (services/tariffs → invoices → appointments → expenses → reports → secretaries/notifications/settings)
6. PWA (Serwist) + تست Lighthouse
7. تست ریسپانسیو کامل روی موبایل/تبلت/دسکتاپ
