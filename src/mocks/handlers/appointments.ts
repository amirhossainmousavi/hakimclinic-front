import { delay, http, HttpResponse } from "msw";
import { appointmentsFixture } from "@/mocks/fixtures/appointments";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import { getAccessToken } from "@/lib/api-client";
import { decodeToken } from "@/lib/auth";
import type { Appointment } from "@/features/appointments/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const appointmentHandlers = [
  http.get("/api/v1/appointments", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const search = url.searchParams.get("search")?.trim();
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = appointmentsFixture;

    // A secretary only sees appointments for their own workplaces (like the backend)
    const currentUser = decodeToken(getAccessToken());
    if (currentUser?.role !== "manager" && currentUser?.scopes?.length) {
      rows = rows.filter((a) => a.admissionPlaceId && currentUser.scopes!.includes(a.admissionPlaceId));
    }

    if (status) rows = rows.filter((a) => a.status === status);
    if (from) rows = rows.filter((a) => a.appointmentDate >= from);
    if (to) rows = rows.filter((a) => a.appointmentDate <= to);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (a) => a.fullName.toLowerCase().includes(q) || a.nationalCode.includes(search) || a.phone.includes(search)
      );
    }
    rows = [...rows].sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: items,
      meta: { page, limit, total },
    });
  }),

  http.post("/api/v1/appointments", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const missing: Record<string, string> = {};
    for (const key of ["fullName", "nationalCode", "phone", "appointmentDate"]) {
      if (!body[key]) missing[key] = "این فیلد الزامی است";
    }
    if (Object.keys(missing).length) return error("VALIDATION_ERROR", "داده ورودی معتبر نیست", 400, missing);

    const admissionPlaceId = typeof body.admissionPlaceId === "string" ? body.admissionPlaceId : null;
    const admissionPlace = admissionPlaceId
      ? admissionPlacesFixture.find((p) => p.id === admissionPlaceId)
      : undefined;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      patientId: typeof body.patientId === "string" ? body.patientId : null,
      fullName: String(body.fullName),
      nationalCode: String(body.nationalCode),
      phone: String(body.phone),
      birthDate: typeof body.birthDate === "string" ? body.birthDate : null,
      admissionType: body.admissionType as Appointment["admissionType"],
      appointmentDate: String(body.appointmentDate),
      appointmentTime: typeof body.appointmentTime === "string" ? body.appointmentTime : null,
      admissionPlaceId,
      admissionPlaceName: admissionPlace?.name ?? null,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };
    appointmentsFixture.unshift(newAppointment);
    return HttpResponse.json({ success: true, data: newAppointment }, { status: 201 });
  }),

  http.patch("/api/v1/appointments/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const appt = appointmentsFixture.find((a) => a.id === params.id);
    if (!appt) return error("APPOINTMENT_NOT_FOUND", "نوبت مورد نظر یافت نشد", 404);
    const body = (await request.json()) as Record<string, unknown>;
    if (body.admissionPlaceId !== undefined) {
      const place = admissionPlacesFixture.find((p) => p.id === body.admissionPlaceId);
      appt.admissionPlaceId = body.admissionPlaceId === null ? null : String(body.admissionPlaceId);
      appt.admissionPlaceName = place?.name ?? null;
    }
    if (body.appointmentTime !== undefined) {
      appt.appointmentTime = body.appointmentTime === null ? null : String(body.appointmentTime);
    }
    Object.assign(appt, body);
    // Sync patient fields with the linked Patient record (like the backend)
    if (appt.patientId) {
      const patient = patientsFixture.find((p) => p.id === appt.patientId);
      if (patient) {
        for (const key of ["fullName", "nationalCode", "phone", "birthDate", "admissionPlaceId"]) {
          if (body[key] !== undefined) (patient as unknown as Record<string, unknown>)[key] = body[key];
        }
        if (body.admissionPlaceId !== undefined) {
          const place = admissionPlacesFixture.find((p) => p.id === body.admissionPlaceId);
          patient.admissionPlaceId = body.admissionPlaceId === null ? null : String(body.admissionPlaceId);
          patient.admissionPlaceName = place?.name ?? null;
        }
      }
    }
    return HttpResponse.json({ success: true, data: appt });
  }),

  http.delete("/api/v1/appointments/:id", async ({ params }) => {
    await delay(LATENCY());
    const idx = appointmentsFixture.findIndex((a) => a.id === params.id);
    if (idx === -1) return error("APPOINTMENT_NOT_FOUND", "نوبت مورد نظر یافت نشد", 404);
    appointmentsFixture.splice(idx, 1);
    return HttpResponse.json({ success: true, data: null });
  }),
];
