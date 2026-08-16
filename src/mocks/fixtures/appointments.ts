import { faker } from "@faker-js/faker/locale/fa";
import type { Appointment } from "@/features/appointments/types";
import { patientsFixture } from "@/mocks/fixtures/patients";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";

function makeAppointment(index: number): Appointment {
  const patient = faker.helpers.arrayElement(patientsFixture);
  const now = new Date();
  const dayOffset = faker.number.int({ min: -7, max: 14 });
  const date = new Date(now);
  date.setDate(now.getDate() + dayOffset);
  const admissionPlace = patient.admissionPlaceId
    ? admissionPlacesFixture.find((p) => p.id === patient.admissionPlaceId)
    : undefined;

  return {
    id: faker.string.uuid(),
    patientId: patient.id,
    fullName: patient.fullName,
    nationalCode: patient.nationalCode,
    phone: patient.phone,
    birthDate: patient.birthDate,
    admissionType: patient.admissionType,
    appointmentDate: date.toISOString(),
    appointmentTime: faker.helpers.arrayElement(["09:00", "10:30", "11:15", "14:00", "16:45"]),
    admissionPlaceId: patient.admissionPlaceId,
    admissionPlaceName: admissionPlace?.name ?? null,
    status: dayOffset < 0
      ? faker.helpers.arrayElement(["done", "postponed", "cancelled"] as const)
      : faker.helpers.arrayElement(["scheduled", "scheduled", "postponed"] as const),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
  };
}

export const appointmentsFixture: Appointment[] = Array.from({ length: 22 }, (_, i) => makeAppointment(i + 1));
