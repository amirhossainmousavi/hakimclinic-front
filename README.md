# پنل کلینیک ارتوپدی فنی حکیم — فرانت‌اند

پنل مدیریت کلینیک — RTL فارسی، React 19، Next.js (App Router)، TanStack Query، shadcn/ui.

## استک

| بخش | انتخاب |
|---|---|
| فریم‌ورک | Next.js 16 (App Router) — Client-First |
| زبان | TypeScript |
| استایل | Tailwind CSS 4 |
| دیزاین سیستم | shadcn/ui (روی Radix) — سفارشی‌سازی‌شده |
| داده/سرور استیت | TanStack Query |
| فرم | React Hook Form + Zod |
| Mock API | MSW (اختیاری، با `NEXT_PUBLIC_USE_MOCK`) |
| PWA | Serwist |
| جهت | RTL کامل، فونت Vazirmatn |

## شروع کار

```bash
npm install
cp .env.example .env.local   # سپس مقادیر را تنظیم کنید
npm run dev
```

پیش‌فرض‌ها: سرویس روی `http://localhost:3000`، backend پیش‌فرض `/api/v1` (proxy شده توسط Next.js). اگر backend جدا باشد، `NEXT_PUBLIC_API_URL` را روی URL مطلق بگذارید.

## متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api/v1` | Base URL بک‌اند؛ مسیر نسبی از طریق proxy Next.js |
| `NEXT_PUBLIC_USE_MOCK` | `false` | `true` → استفاده از MSW mocks (توسعه/دمو) |
| `NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS` | `false` | `true` → نمایش حساب‌های آزمایشی روی صفحه ورود. **فقط** در staging/demo؛ در production خاموش بماند |

## ساختار

```
src/
  app/                   # صفحات + layout (RTL)، favicon.ico، icon.svg، manifest.ts، sw.ts
    (auth)/login/
    (dashboard)/         # dashboard, patients, appointments, invoices, insurances,
                         # services, tariffs, reports/revenue, expenses, secretaries,
                         # notifications, settings
  components/            # ui (shadcn) + design-system + skeletons
  features/<module>/     # api.ts, hooks.ts, types.ts و کامپوننت‌های هر ماژول
  lib/                   # api-client.ts (fetch wrapper + توکن + refresh)، query-client، jalali، roles، utils
  mocks/                 # MSW handlers + fixtures
```

قانون: کامپوننت صفحه هرگز مستقیم `fetch` صدا نمی‌زند؛ از `features/<module>/hooks.ts` استفاده می‌کند که خودش از `lib/api-client.ts` عبور می‌کند.

## داده و احراز هویت

- توکن‌ها در `localStorage` (`clinic_access_token`, `clinic_refresh_token`) نگهداری می‌شوند.
- `apiFetch` بعد از 401 یک‌بار تلاش refresh می‌کند؛ در صورت شکست → ریدایرکت به `/login`.
- خطای `success:false` به `ApiError` تبدیل می‌شود.
- URL فایل‌های محلی (`/uploads/...`) به‌صورت مطلق ساخته و توکن access به آن append می‌شود (`?token=...`) چون `<img>/<video>` هدر Authorization نمی‌فرستند — در `features/patients/components/PatientDetailDialog.tsx` (`fileSrc`).

## اسکریپت‌ها

```bash
npm run dev        # سرور توسعه
npm run build      # build production (webpack)
npm run start      # اجرای build شده
npm run lint       # eslint
```

## مستندات بیشتر

- معماری فرانت‌اند: [`clinic-panel-frontend-architecture.md`](clinic-panel-frontend-architecture.md)
- معماری بک‌اند: [`clinic-panel-backend-architecture.md`](clinic-panel-backend-architecture.md)
