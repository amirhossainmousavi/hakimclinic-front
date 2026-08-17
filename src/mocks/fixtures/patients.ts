import { faker } from "@faker-js/faker/locale/fa";
import { insurancesFixture } from "@/mocks/fixtures/insurances";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import type { Patient } from "@/features/patients/types";

const LAST_NAMES = [
  "احمدی", "محمدی", "حسینی", "رضایی", "کریمی", "موسوی", "جعفری",
  "نعمتی", "صادقی", "عباسی", "مرادی", "قاسمی", "رحیمی", "زاده",
  "علی‌پور", "کاظمی", "نصیری", "شریفی", "امینی", "قربانی",
];

const FIRST_NAMES = [
  "علی", "محمد", "حسین", "رضا", "امیر", "مهدی", "سعید",
  "حمید", "علی‌رضا", "محمدعلی", "فاطمه", "زهرا", "مریم", "نرگس",
  "الهام", "سارا", "مینا", "لیلا", "زینب", "معصومه",
];

const STATUSES: Patient["status"][] = [
  "admitted",
  "pending_insurance_approval",
  "in_production",
  "ready_for_delivery",
  "delivered",
];

/** Mock user ids that can register admissions */
const ADMITTERS = ["u-manager", "u-sec1", "u-sec2", "u-sec3"];

function makePatient(index: number): Patient {
  const fullName = `${faker.helpers.arrayElement(FIRST_NAMES)} ${faker.helpers.arrayElement(LAST_NAMES)}`;
  const insuranceApproved = faker.datatype.boolean({ probability: 0.6 });
  const place = faker.helpers.arrayElement(admissionPlacesFixture);

  return {
    id: faker.string.uuid(),
    nationalCode: faker.string.numeric(10),
    fullName,
    phone: `09${faker.string.numeric(9)}`,
    birthDate: faker.date.birthdate({ min: 18, max: 80, mode: "age" }).toISOString().slice(0, 10),
    fileNumber: String(1000 + index),
    customFileNumber: `PF-${String(1000 + index)}`,
    admissionPlaceId: place.id,
    admissionPlaceName: place.name,
    admittedByUserId: faker.helpers.arrayElement(ADMITTERS),
    admissionType: insuranceApproved ? "insured" : "free",
    insuranceId: insuranceApproved
      ? faker.helpers.arrayElement(insurancesFixture).id
      : null,
    insuranceName: null,
    status: faker.helpers.arrayElement(STATUSES),
    suggestedDoctor: faker.datatype.boolean({ probability: 0.5 })
      ? `دکتر ${faker.helpers.arrayElement(LAST_NAMES)}`
      : null,
    description: faker.datatype.boolean({ probability: 0.4 })
      ? faker.helpers.arrayElement([
          "استفاده از کفش طبی به مدت ۶ ماه",
          "درد شدید زانو، نیاز به بررسی مجدد",
          "دیابت نوع ۲ — کنترل قند قبل از قالب‌گیری",
          "گچ گرفته‌شدن پای چپ",
        ])
      : null,
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  };
}

export const patientsFixture: Patient[] = Array.from({ length: 25 }, (_, i) =>
  makePatient(i)
);

for (const p of patientsFixture) {
  if (p.insuranceId) {
    p.insuranceName =
      insurancesFixture.find((ins) => ins.id === p.insuranceId)?.name ?? null;
  }
}
