export type InvoiceType = "final" | "pro_forma";
export type PaymentType = "card_to_card" | "pos" | "bank_transfer";

export interface InvoiceItem {
  id: string;
  serviceId: string;
  serviceName: string;
  tariffId: string | null;
  tariffName: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  invoiceType: InvoiceType;
  paymentType: PaymentType;
  totalAmount: number;
  discountTotal: number;
  prepaidAmount: number;
  description: string | null;
  serviceDate: string | null;
  iban: string | null;
  ibanNote: string | null;
  pdfUrl: string | null;
  createdAt: string;
  items: InvoiceItem[];
}

export interface CreateInvoiceInput {
  patientId: string;
  invoiceType: InvoiceType;
  paymentType: PaymentType;
  items: Array<{
    serviceId: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
  }>;
  prepaidAmount?: number;
  description?: string;
  serviceDate?: string;
  iban?: string;
  ibanNote?: string;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  final: "فاکتور نهایی",
  pro_forma: "پیش‌فاکتور",
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  card_to_card: "کارت به کارت",
  pos: "POS",
  bank_transfer: "انتقال به حساب",
};
