import { delay, http, HttpResponse } from "msw";
import { invoicesFixture } from "@/mocks/fixtures/invoices";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { servicesFixture } from "@/mocks/fixtures/services";
import type { CreateInvoiceInput, InvoiceItem } from "@/features/invoices/types";

const LATENCY = () => Math.floor(Math.random() * 500) + 300;

const error = (code: string, message: string, status: number, details: unknown = null) =>
  HttpResponse.json({ success: false, error: { code, message, details } }, { status });

export const invoiceHandlers = [
  http.get("/api/v1/invoices", async ({ request }) => {
    await delay(LATENCY());
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const invoiceType = url.searchParams.get("invoiceType");
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 10);

    let rows = invoicesFixture;
    if (invoiceType) rows = rows.filter((iv) => iv.invoiceType === invoiceType);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((iv) => iv.invoiceNumber.toLowerCase().includes(q));
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

  http.post("/api/v1/invoices", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as CreateInvoiceInput;
    if (!body.patientId) return error("VALIDATION_ERROR", "بیمار الزامی است", 400);
    if (!body.items?.length) return error("VALIDATION_ERROR", "حداقل یک ردیف خدمت الزامی است", 400);

    const patient = patientsFixture.find((p) => p.id === body.patientId);
    if (!patient) return error("PATIENT_NOT_FOUND", "بیمار مورد نظر یافت نشد", 404);

    const items: InvoiceItem[] = body.items.map((raw) => {
      const svc = servicesFixture.find((s) => s.id === raw.serviceId)!;
      const discountAmount = raw.discountAmount ?? 0;
      return {
        id: crypto.randomUUID(),
        serviceId: svc.id,
        serviceName: svc.treatmentProcess,
        tariffId: null,
        tariffName: null,
        quantity: raw.quantity,
        unitPrice: raw.unitPrice,
        discountAmount,
        lineTotal: raw.unitPrice * raw.quantity - discountAmount,
      };
    });

    const discountTotal = items.reduce((sum, it) => sum + it.discountAmount, 0);
    const prepaidAmount = body.prepaidAmount ?? 0;
    const totalAmount = Math.max(
      items.reduce((sum, it) => sum + it.lineTotal, 0) - prepaidAmount,
      0
    );

    const newInvoice = {
      id: crypto.randomUUID(),
      invoiceNumber: `INV-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.fullName,
      invoiceType: body.invoiceType,
      paymentType: body.paymentType,
      totalAmount,
      discountTotal,
      prepaidAmount,
      description: body.description ?? null,
      serviceDate: body.serviceDate ?? null,
      iban: body.iban ?? null,
      ibanNote: body.ibanNote ?? null,
      pdfUrl: null,
      createdAt: new Date().toISOString(),
      items,
    };
    invoicesFixture.unshift(newInvoice);
    return HttpResponse.json({ success: true, data: newInvoice }, { status: 201 });
  }),

  http.post("/api/v1/invoices/pro-forma", async ({ request }) => {
    await delay(LATENCY());
    const body = (await request.json()) as CreateInvoiceInput;
    if (!body.items?.length) return error("VALIDATION_ERROR", "حداقل یک ردیف خدمت الزامی است", 400);

    const items: InvoiceItem[] = body.items.map((raw) => {
      const svc = servicesFixture.find((s) => s.id === raw.serviceId)!;
      const discountAmount = raw.discountAmount ?? 0;
      return {
        id: crypto.randomUUID(),
        serviceId: svc.id,
        serviceName: svc.treatmentProcess,
        tariffId: null,
        tariffName: null,
        quantity: raw.quantity,
        unitPrice: raw.unitPrice,
        discountAmount,
        lineTotal: raw.unitPrice * raw.quantity - discountAmount,
      };
    });

    return HttpResponse.json({
      success: true,
      data: {
        invoiceType: "pro_forma",
        totalAmount: items.reduce((sum, it) => sum + it.lineTotal, 0),
        discountTotal: items.reduce((sum, it) => sum + it.discountAmount, 0),
        items,
      },
    });
  }),

  http.get("/api/v1/invoices/:id/pdf", async ({ params }) => {
    await delay(LATENCY());
    // Static sample PDF — real generation happens on the backend (Puppeteer).
    // Only enough to test the frontend download path.
    const invoice = invoicesFixture.find((iv) => iv.id === params.id);
    const patientName = invoice?.patientName ?? "بیمار";
    const encoded = encodeURIComponent(`فاکتور-${patientName}.pdf`);
    const pdfBase64 =
      "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAxIDAgUi9NZWRpYUJveFswIDAgNjEyIDc5Ml0vQ29udGVudHMgMyAwIFI+PgplbmRvYmoKMyAwIG9iago8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQKNDggNTAgVEQKL0YxIDI0IFRGCihQREYgUGxhY2Vob2xkZXIgLSBJbnZvaWNlIC0gRGVtbyBQREYgZ2VuZXJhdGVkIGJ5IENsaW5pYyBQYW5lbCkKVEUKRW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKMSAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMiAwIFJdL0NvdW50IDE+PgplbmRvYmoKNSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMSAwIFI+PgplbmRvYmoKNiAwIG9iago8PC9Qcm9kdWNlcihDbGluaWMgUGFuZWwgTW9jayAvIFB1cHBldGVlcikuL0ZvbnRzPDwvRjEgNCAwIFI+Pj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMTkgMDAwMDAgbiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDY1IDAwMDAwIG4gCjAwMDAwMDAxNDUgMDAwMDAgbiAKMDAwMDAwMDE5OSAwMDAwMCBuIAowMDAwMDAwMjU0IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA3L1Jvb3QgNSAwIFIvSW5mbzYgMCBSL0lEIFs8RUVGRUVGRUVGRUVGRUVGRUVGRUVGRUVGRUVGRUVGRUVGPj1FRkVFRkVFRkVFRkVFRkVFRkVFRkVFRkVFRkVFRkVGPj4+PgpzdGFydHhyZWYKMzI1CiUlRU9GCg==";
    const pdfBytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    return new HttpResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice.pdf"; filename*=UTF-8''${encoded}`,
      },
    });
  }),
];
