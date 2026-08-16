import { delay, http, HttpResponse } from "msw";
import type { AuthUser, LoginResponse } from "@/features/auth/types";
import { secretariesFixture } from "@/mocks/fixtures/secretaries";

const LATENCY = () => Math.floor(Math.random() * 400) + 300;

// شبیه‌سازی JWT واقعی — این بخش فقط برای mock؛ در بک‌اند واقعی توکن از سرور می‌آید
function signToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=+$/, "");
  const body = btoa(JSON.stringify(payload)).replace(/=+$/, "");
  return `${header}.${body}.mock`;
}

const USERS: Record<string, AuthUser> = {
  // مدیر: کدملی 1111111111
  "1111111111": {
    id: "u-manager",
    fullName: "مدیر کلینیک",
    nationalCode: "1111111111",
    phone: "09120000000",
    role: "manager",
  },
  // منشی: کدملی 2222222222
  "2222222222": {
    id: "u-sec2",
    fullName: "منشی پذیرش",
    nationalCode: "2222222222",
    phone: "09220000000",
    role: "secretary",
  },
  // منشی: کدملی 3333333333
  "3333333333": {
    id: "u-sec1",
    fullName: "منشی پیگیری",
    nationalCode: "3333333333",
    phone: "09330000000",
    role: "secretary",
  },
  // منشی: کدملی 4444444444
  "4444444444": {
    id: "u-sec3",
    fullName: "منشی پذیرش",
    nationalCode: "4444444444",
    phone: "09440000000",
    role: "secretary",
  },
};

const DEMO_PASSWORDS: Record<string, string> = {
  "1111111111": "09120000000",
  "2222222222": "09220000000",
  "3333333333": "09330000000",
  "4444444444": "09440000000",
};

/** scope و دسترسی‌های منشی از فیکسچر — mock معادل بک‌اند که در JWT می‌گذارد */
function secretaryClaims(nationalCode: string) {
  const sec = secretariesFixture.find((s) => s.nationalCode === nationalCode);
  return {
    scopes: sec?.secretaryScopes.map((s) => s.place.id) ?? [],
    permissions: sec?.secretaryPermissions ?? [],
  };
}

export const authHandlers = [
  http.post("/api/v1/auth/login", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as { nationalCode?: string; phone?: string };
    const user = body.nationalCode ? USERS[body.nationalCode] : undefined;

    if (!user || DEMO_PASSWORDS[user.nationalCode] !== body.phone) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "INVALID_CREDENTIALS", message: "کدملی یا شماره تلفن اشتباه است", details: null },
        },
        { status: 401 }
      );
    }

    const claims =
      user.role === "secretary" ? secretaryClaims(user.nationalCode) : { scopes: [], permissions: [] };

    const accessToken = signToken({
      sub: user.id,
      role: user.role,
      clinicId: "clinic-demo",
      ...claims,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    });
    const refreshToken = signToken({ sub: user.id, type: "refresh" });

    const res: LoginResponse = { accessToken, refreshToken, user };
    return HttpResponse.json({ success: true, data: res });
  }),

  http.post("/api/v1/auth/refresh", async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken) {
      return HttpResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "نشست منقضی شده", details: null } },
        { status: 401 }
      );
    }
    const accessToken = signToken({
      sub: "u-manager",
      role: "manager",
      clinicId: "clinic-demo",
      scopes: [],
      permissions: [],
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    });
    return HttpResponse.json({ success: true, data: { accessToken } });
  }),

  http.post("/api/v1/auth/logout", async () => {
    await delay(200);
    return HttpResponse.json({ success: true, data: null });
  }),
];
