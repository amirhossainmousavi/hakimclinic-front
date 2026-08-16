import { delay, http, HttpResponse } from "msw";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { insurancesFixture } from "@/mocks/fixtures/insurances";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import { servicesFixture } from "@/mocks/fixtures/services";
import { getAccessToken } from "@/lib/api-client";
import { decodeToken } from "@/lib/auth";
import type { PatientFile, PatientService } from "@/features/patients/types";

function insuranceNameFor(id: string | null | undefined): string | null {
  if (!id) return null;
  return insurancesFixture.find((i) => i.id === id)?.name ?? null;
}

function admissionPlaceFor(id: string | null | undefined): { id: string | null; name: string | null } {
  if (!id) return { id: null, name: null };
  const place = admissionPlacesFixture.find((p) => p.id === id);
  return { id, name: place?.name ?? null };
}

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const patientFiles = new Map<string, PatientFile[]>();

const patientServices = new Map<string, PatientService[]>();

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// For the "New invoice" flow: seed a few patients with dated services
// so the day-selection step is visible in the preview.
function seedPatientServices() {
  const serviceRows = servicesFixture.slice(0, 8);
  const dates = ["2026-08-05", "2026-08-12"];
  patientsFixture.slice(0, 4).forEach((p, pi) => {
    const list: PatientService[] = [];
    serviceRows.slice(0, pi === 0 ? 3 : pi === 1 ? 2 : 1).forEach((svc, si) => {
      const date = dates[si % dates.length];
      list.push({
        id: crypto.randomUUID(),
        patientId: p.id,
        serviceId: svc.id,
        serviceDate: `${date}T10:${String(20 + si * 10).padStart(2, "0")}:00.000Z`,
        unitPrice: svc.price,
        createdAt: new Date(`${date}T09:00:00.000Z`).toISOString(),
        service: svc,
      });
    });
    patientServices.set(p.id, list);
  });
}
seedPatientServices();

export const patientHandlers = [
  http.get("/api/v1/patients", async ({ request }) => {
    await delay(LATENCY());

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const placeId = url.searchParams.get("placeId");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = patientsFixture;

    // A secretary only sees patients from their own workplaces (like the backend)
    const currentUser = decodeToken(getAccessToken());
    if (currentUser?.role !== "manager" && currentUser?.scopes?.length) {
      rows = rows.filter((p) => p.admissionPlaceId && currentUser.scopes!.includes(p.admissionPlaceId));
    }

    if (status) rows = rows.filter((p) => p.status === status);
    if (placeId) rows = rows.filter((p) => p.admissionPlaceId === placeId);
    if (search) {
      rows = rows.filter((p) => p.nationalCode.includes(search) || p.fullName.includes(search));
    }

    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);

    return HttpResponse.json({
      success: true,
      data: items,
      meta: { page, limit, total },
    });
  }),

  http.post("/api/v1/patients", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as Record<string, unknown>;
    const currentUser = decodeToken(getAccessToken());

    const missing: Record<string, string> = {};
    for (const key of ["nationalCode", "fullName", "phone", "birthDate", "admissionType"]) {
      if (!body[key]) {
        missing[key] = "این فیلد الزامی است";
      }
    }
    if (Object.keys(missing).length) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "داده ورودی معتبر نیست", details: missing },
        },
        { status: 400 }
      );
    }

    const fullName = String(body.fullName);
    const admissionPlace = admissionPlaceFor(body.admissionPlaceId as string | undefined);
    const newPatient = {
      id: crypto.randomUUID(),
      nationalCode: String(body.nationalCode),
      fullName,
      phone: String(body.phone),
      birthDate: (body.birthDate as string) ?? null,
      fileNumber: String(1000 + patientsFixture.length),
      admissionPlaceId: admissionPlace.id,
      admissionPlaceName: admissionPlace.name,
      admittedByUserId: currentUser?.sub ?? null,
      admissionType: body.admissionType as never,
      insuranceId: (body.insuranceId as string) ?? null,
      insuranceName: insuranceNameFor(body.insuranceId as string | undefined),
      status:
        body.admissionType === "free"
          ? ("admitted" as const)
          : ("pending_insurance_approval" as const),
      suggestedDoctor: (body.suggestedDoctor as string) ?? null,
      description: (body.description as string) ?? null,
      createdAt: new Date().toISOString(),
    };
    patientsFixture.unshift(newPatient);

    const services = body.services as Array<{ serviceId: string; serviceDate?: string }> | undefined;
    if (services && services.length > 0) {
      const attached = services.map((s) => {
        const service = servicesFixture.find((sv) => sv.id === s.serviceId);
        if (!service) return null;
        const record: PatientService = {
          id: crypto.randomUUID(),
          patientId: newPatient.id,
          serviceId: service.id,
          serviceDate: s.serviceDate ?? todayISO(),
          unitPrice: service.price,
          createdAt: new Date().toISOString(),
          service,
        };
        return record;
      });
      const valid = attached.filter((r): r is PatientService => r !== null);
      if (valid.length !== services.length) {
        return HttpResponse.json(
          {
            success: false,
            error: { code: "SERVICE_NOT_FOUND", message: "خدمت مورد نظر یافت نشد", details: null },
          },
          { status: 404 }
        );
      }
      patientServices.set(newPatient.id, valid);
    }

    return HttpResponse.json({ success: true, data: newPatient }, { status: 201 });
  }),

  http.get("/api/v1/patients/:id", async ({ params }) => {
    await delay(LATENCY());
    const patient = patientsFixture.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "PATIENT_NOT_FOUND", message: "بیمار مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: patient });
  }),

  http.patch("/api/v1/patients/:id", async ({ params, request }) => {
    await delay(LATENCY());
    const patient = patientsFixture.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "PATIENT_NOT_FOUND", message: "بیمار مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    Object.assign(patient, body);
    if ("insuranceId" in body) {
      patient.insuranceName = insuranceNameFor(body.insuranceId as string | null);
    }
    if ("admissionPlaceId" in body) {
      const place = admissionPlaceFor(body.admissionPlaceId as string | null);
      patient.admissionPlaceId = place.id;
      patient.admissionPlaceName = place.name;
    }
    return HttpResponse.json({ success: true, data: patient });
  }),

  http.patch("/api/v1/patients/:id/status", async ({ params, request }) => {
    await delay(LATENCY());
    const patient = patientsFixture.find((p) => p.id === params.id);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "PATIENT_NOT_FOUND", message: "بیمار مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    const { status } = (await request.json()) as { status: string };
    patient.status = status as never;
    return HttpResponse.json({ success: true, data: patient });
  }),

  http.get("/api/v1/patients/:id/files", async ({ params }) => {
    await delay(LATENCY());
    return HttpResponse.json({
      success: true,
      data: patientFiles.get(String(params.id)) ?? [],
    });
  }),

  http.post("/api/v1/patients/:id/files", async ({ params, request }) => {
    await delay(LATENCY());
    const patientId = String(params.id);
    const patient = patientsFixture.find((p) => p.id === patientId);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "PATIENT_NOT_FOUND", message: "بیمار مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    const fd = await request.formData();
    const file = fd.get("file");
    const isVideo =
      typeof file === "object" && file !== null && "type" in file
        ? String((file as File).type).startsWith("video/")
        : false;

    const mockFile: PatientFile = {
      id: crypto.randomUUID(),
      patientId,
      type: isVideo ? "video" : "image",
      mimeType: "image/jpeg",
      fileName: "sample.jpg",
      fileSize: 20480,
      url: isVideo
        ? "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
        : "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200",
      createdAt: new Date().toISOString(),
    };
    const list = patientFiles.get(patientId) ?? [];
    list.unshift(mockFile);
    patientFiles.set(patientId, list);
    return HttpResponse.json({ success: true, data: mockFile }, { status: 201 });
  }),

  http.delete("/api/v1/files/:id", async ({ params }) => {
    await delay(LATENCY());
    let removed = false;
    for (const [pid, list] of patientFiles) {
      const next = list.filter((f) => f.id !== params.id);
      if (next.length !== list.length) {
        patientFiles.set(pid, next);
        removed = true;
      }
    }
    return HttpResponse.json({
      success: true,
      data: { message: removed ? "فایل حذف شد" : "فایلی یافت نشد" },
    });
  }),

  http.get("/api/v1/patients/:id/services", async ({ params }) => {
    await delay(LATENCY());
    return HttpResponse.json({
      success: true,
      data: patientServices.get(String(params.id)) ?? [],
    });
  }),

  http.post("/api/v1/patients/:id/services", async ({ params, request }) => {
    await delay(LATENCY());
    const patientId = String(params.id);
    const patient = patientsFixture.find((p) => p.id === patientId);
    if (!patient) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "PATIENT_NOT_FOUND", message: "بیمار مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    const body = (await request.json()) as { serviceId: string; serviceDate?: string };
    const service = servicesFixture.find((s) => s.id === body.serviceId);
    if (!service) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: "SERVICE_NOT_FOUND", message: "خدمت مورد نظر یافت نشد", details: null },
        },
        { status: 404 }
      );
    }
    const attached: PatientService = {
      id: crypto.randomUUID(),
      patientId,
      serviceId: service.id,
      serviceDate: body.serviceDate ?? todayISO(),
      unitPrice: service.price,
      createdAt: new Date().toISOString(),
      service,
    };
    const list = patientServices.get(patientId) ?? [];
    list.unshift(attached);
    patientServices.set(patientId, list);
    return HttpResponse.json({ success: true, data: attached }, { status: 201 });
  }),

  http.delete("/api/v1/patients/services/:id", async ({ params }) => {
    await delay(LATENCY());
    let removed = false;
    for (const [pid, list] of patientServices) {
      const next = list.filter((s) => s.id !== params.id);
      if (next.length !== list.length) {
        patientServices.set(pid, next);
        removed = true;
      }
    }
    return HttpResponse.json({
      success: true,
      data: { message: removed ? "خدمت حذف شد" : "خدمتی یافت نشد" },
    });
  }),
];
