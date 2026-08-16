import { faker } from "@faker-js/faker/locale/fa";
import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import type { CompanyInvoice, DailyExpense, Expense } from "@/features/expenses/types";

/** مراکزی که هزینه روزانه می‌تواند داشته باشد — گردش بین سه مرکز */
const EXPENSE_PLACES = admissionPlacesFixture;

const DAILY_TITLES = [
  "قهوه و میان‌وعده", "تاکسی اداری", "خرید وسایل مصرفی", "کرایه پیک",
  "تعمیرات تجهیزات", "قبض آب", "قبض برق", "خرید ملزومات اداری", "روزنامه و مطبوعات",
  "ایاب و ذهاب کارکنان", "تلفن و اینترنت", "جانمایی و جابه‌جایی",
];

const COMPANY_NAMES = [
  "تجهیزات پزشکی پارس", "ارتوپدی مدرن", "مواد اولیه پلی‌پروپیلن توس",
  "سیلیکون‌سازی البرز", "تأمین‌کننده لاینر", "فلزات صنعتی تهران",
];

const PARTS = [
  "پلی‌پروپیلن", "سیلیکون ژل", "رزین اکریلیک", "کربن فایبر", "تیتانیوم", "چرم", "فوم کیهزی",
];

function makeDaily(index: number): DailyExpense {
  const date = faker.date.recent({ days: 40 });
  const place = EXPENSE_PLACES[index % EXPENSE_PLACES.length];
  return {
    id: faker.string.uuid(),
    type: "daily",
    title: faker.helpers.arrayElement(DAILY_TITLES),
    amount: faker.number.int({ min: 200_000, max: 8_000_000 }),
    expenseDate: date.toISOString(),
    admissionPlaceId: place.id,
    admissionPlaceName: place.name,
    description: faker.datatype.boolean({ probability: 0.4 }) ? faker.lorem.sentence() : null,
    createdAt: date.toISOString(),
  };
}

function makeCompany(index: number): CompanyInvoice {
  const quantity = faker.number.int({ min: 2, max: 50 });
  const unitAmount = faker.number.int({ min: 500_000, max: 12_000_000 });
  const date = faker.date.recent({ days: 50 });
  return {
    id: faker.string.uuid(),
    type: "company",
    title: `خرید مواد اولیه ${index}`,
    companyName: faker.helpers.arrayElement(COMPANY_NAMES),
    amount: quantity * unitAmount,
    invoiceDate: date.toISOString(),
    partName: faker.helpers.arrayElement(PARTS),
    quantity,
    unitAmount,
    description: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : null,
    createdAt: date.toISOString(),
  };
}

export const expensesFixture: Expense[] = [
  ...Array.from({ length: 14 }, (_, i) => makeDaily(i)),
  ...Array.from({ length: 8 }, (_, i) => makeCompany(i)),
].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
