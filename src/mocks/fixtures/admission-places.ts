import { insurancesFixture } from "@/mocks/fixtures/insurances";
import type { AdmissionPlace } from "@/features/admission-places/types";

function insuranceName(id: string): string {
  return insurancesFixture.find((i) => i.id === id)?.name ?? id;
}

const PLACES: Array<{
  name: string;
  address: string;
  description?: string;
  admissionType: AdmissionPlace["admissionType"];
  insuranceIds: string[];
}> = [
  {
    name: "درمانگاه حکیم",
    address: "تهران، خیابان ولیعصر، پلاک ۱۲۳",
    description: "درمانگاه تخصصی ارتوپدی فنی",
    admissionType: "both",
    insuranceIds: ["ins-1", "ins-2", "ins-5"],
  },
  {
    name: "بیمارستان خاتم",
    address: "تهران، خیابان شهید مطهری، بیمارستان خاتم",
    admissionType: "insured_only",
    insuranceIds: ["ins-1", "ins-3"],
  },
  {
    name: "کلینیک امید",
    address: "کرج، میدان امام حسین",
    admissionType: "free_only",
    insuranceIds: [],
  },
];

export const admissionPlacesFixture: AdmissionPlace[] = PLACES.map((p, i) => ({
  id: `place-${i + 1}`,
  name: p.name,
  address: p.address,
  description: p.description ?? null,
  admissionType: p.admissionType,
  insurances: p.insuranceIds.map((insuranceId, j) => ({
    id: `place-${i + 1}-ins-${j + 1}`,
    insuranceId,
    insurance: {
      id: insuranceId,
      name: insuranceName(insuranceId),
      isApproved: true,
      createdAt: "",
    },
  })),
  createdAt: new Date(2025, 5, 10 + i).toISOString(),
}));
