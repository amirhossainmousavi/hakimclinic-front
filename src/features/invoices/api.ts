import { apiFetch, apiFetchRaw, buildQueryString, getAccessToken } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceType,
} from "@/features/invoices/types";

export interface InvoiceListParams {
  search?: string;
  invoiceType?: InvoiceType;
  page?: number;
  limit?: number;
}

export async function fetchInvoices(
  params: InvoiceListParams
): Promise<Paginated<Invoice>> {
  const res = await apiFetchRaw<Invoice[]>(
    `/invoices${buildQueryString(params as Record<string, unknown>)}`
  );
  const meta = res.meta ?? { page: 1, limit: 10, total: res.data.length };
  return { items: res.data, ...meta };
}

export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  return apiFetch<Invoice>("/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createProForma(
  input: CreateInvoiceInput
): Promise<Pick<Invoice, "invoiceType" | "totalAmount" | "discountTotal" | "items">> {
  return apiFetch("/invoices/pro-forma", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

function parseFilename(contentDisposition: string | null, fallbackName: string): string {
  const sanitize = (s: string) => s.replace(/[\\/:*?"<>|]/g, "").trim() || "invoice.pdf";
  if (contentDisposition) {
    const encoded = /filename\*=UTF-8''([^;]+)/.exec(contentDisposition);
    if (encoded?.[1]) return sanitize(decodeURIComponent(encoded[1]));
    const ascii = /filename="?([^"]+)"?/.exec(contentDisposition);
    if (ascii?.[1]) return sanitize(ascii[1]);
  }
  return sanitize(fallbackName);
}

export async function downloadInvoicePdf(invoiceId: string, fallbackName = "invoice.pdf"): Promise<void> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
  const token = getAccessToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}/invoices/${invoiceId}/pdf`, { headers });

  if (!res.ok) {
    let message = "دریافت فایل PDF ناموفق بود";
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* Body is not JSON */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = parseFilename(res.headers.get("Content-Disposition"), fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
