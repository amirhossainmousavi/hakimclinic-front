import { faker } from "@faker-js/faker/locale/fa";
import type { Invoice } from "@/features/invoices/types";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { servicesFixture } from "@/mocks/fixtures/services";
import { tariffsFixture } from "@/mocks/fixtures/tariffs";

function makeInvoice(index: number): Invoice {
  const patient = faker.helpers.arrayElement(patientsFixture);
  const serviceCount = faker.number.int({ min: 1, max: 3 });
  const chosenServices = faker.helpers.arrayElements(servicesFixture, serviceCount);

  const items = chosenServices.map((svc, i) => {
    const quantity = faker.number.int({ min: 1, max: 2 });
    const discountAmount = faker.datatype.boolean({ probability: 0.3 })
      ? Math.round(svc.price * 0.05)
      : 0;
    return {
      id: faker.string.uuid(),
      serviceId: svc.id,
      serviceName: svc.treatmentProcess,
      tariffId: svc.serviceType === "prosthesis" ? tariffsFixture[i % tariffsFixture.length].id : null,
      tariffName: svc.serviceType === "prosthesis" ? tariffsFixture[i % tariffsFixture.length].itemDescription : null,
      quantity,
      unitPrice: svc.price,
      discountAmount,
      lineTotal: svc.price * quantity - discountAmount,
    };
  });

  const totalAmount = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const discountTotal = items.reduce((sum, it) => sum + it.discountAmount, 0);
  const invoiceType = faker.helpers.arrayElement(["final", "pro_forma"] as const);
  const prepaidAmount =
    faker.datatype.boolean({ probability: 0.2 }) ? Math.round(totalAmount * 0.3) : 0;

  return {
    id: faker.string.uuid(),
    invoiceNumber: `INV-${String(20250101 + index)}`,
    patientId: patient.id,
    patientName: patient.fullName,
    invoiceType,
    paymentType: faker.helpers.arrayElement(["card_to_card", "pos", "bank_transfer"] as const),
    totalAmount: Math.max(totalAmount - prepaidAmount, 0),
    discountTotal,
    prepaidAmount,
    description: null,
    serviceDate: null,
    iban: faker.datatype.boolean({ probability: 0.5 }) ? "IR620120000000003456789012" : null,
    ibanNote: null,
    pdfUrl: null,
    createdAt: faker.date.recent({ days: 60 }).toISOString(),
    items,
  };
}

export const invoicesFixture: Invoice[] = Array.from({ length: 24 }, (_, i) => makeInvoice(i));
