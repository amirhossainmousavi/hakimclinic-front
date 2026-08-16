import { delay, http, HttpResponse } from "msw";
import { notificationsFixture } from "@/mocks/fixtures/notifications";
import type { Notification } from "@/features/notifications/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

export const notificationHandlers = [
  http.get("/api/v1/notifications", async () => {
    await delay(LATENCY());
    const data: Notification[] = [...notificationsFixture].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ success: true, data });
  }),

  http.post("/api/v1/notifications", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as { message: string };
    if (!body.message?.trim()) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "متن اطلاعیه الزامی است", details: { message: "این فیلد الزامی است" } },
        },
        { status: 400 }
      );
    }
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      message: body.message,
      createdAt: new Date().toISOString(),
      read: false,
      createdByUserName: "مدیر کلینیک",
    };
    notificationsFixture.unshift(newNotification);
    return HttpResponse.json({ success: true, data: newNotification }, { status: 201 });
  }),
];
