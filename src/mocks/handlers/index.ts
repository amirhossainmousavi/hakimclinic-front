import { authHandlers } from "@/mocks/handlers/auth";
import { patientHandlers } from "@/mocks/handlers/patients";
import { serviceHandlers } from "@/mocks/handlers/services";
import { tariffHandlers } from "@/mocks/handlers/tariffs";
import { invoiceHandlers } from "@/mocks/handlers/invoices";
import { appointmentHandlers } from "@/mocks/handlers/appointments";
import { expenseHandlers } from "@/mocks/handlers/expenses";
import { reportHandlers } from "@/mocks/handlers/reports";
import { secretaryHandlers } from "@/mocks/handlers/secretaries";
import { notificationHandlers } from "@/mocks/handlers/notifications";
import { insuranceHandlers } from "@/mocks/handlers/insurances";
import { admissionPlaceHandlers } from "@/mocks/handlers/admission-places";
import { dashboardHandlers } from "@/mocks/handlers/dashboard";

export const handlers = [
  ...authHandlers,
  ...patientHandlers,
  ...serviceHandlers,
  ...tariffHandlers,
  ...invoiceHandlers,
  ...appointmentHandlers,
  ...expenseHandlers,
  ...reportHandlers,
  ...secretaryHandlers,
  ...notificationHandlers,
  ...insuranceHandlers,
  ...admissionPlaceHandlers,
  ...dashboardHandlers,
];
