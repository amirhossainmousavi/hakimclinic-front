import { admissionPlacesFixture } from "@/mocks/fixtures/admission-places";
import type { SecretaryPermissionKey } from "@/lib/types";
import type { Secretary } from "@/features/secretaries/types";

const SECRETARIES: Array<{
  nationalCode: string;
  phone: string;
  fullName: string;
  placeIds: string[];
  permissions: SecretaryPermissionKey[];
}> = [
  {
    nationalCode: "2222222222",
    phone: "09220000000",
    fullName: "زهرا محمدی",
    placeIds: ["place-1", "place-2"],
    permissions: ["dashboard", "patients", "invoices", "appointments", "expenses"],
  },
  {
    nationalCode: "3333333333",
    phone: "09330000000",
    fullName: "مریم رضایی",
    placeIds: ["place-1", "place-3"],
    permissions: ["dashboard", "patients", "invoices"],
  },
  {
    nationalCode: "4444444444",
    phone: "09440000000",
    fullName: "سارا احمدی",
    placeIds: ["place-1"],
    permissions: ["dashboard", "patients", "invoices"],
  },
  {
    nationalCode: "5555555555",
    phone: "09550000000",
    fullName: "نگار کریمی",
    placeIds: ["place-3", "place-2"],
    permissions: ["dashboard", "patients", "invoices"],
  },
  {
    nationalCode: "6666666666",
    phone: "09660000000",
    fullName: "الهام موسوی",
    placeIds: ["place-1", "place-2", "place-3"],
    permissions: ["dashboard", "patients", "invoices", "appointments"],
  },
  {
    nationalCode: "7777777777",
    phone: "09770000000",
    fullName: "فاطمه جعفری",
    placeIds: ["place-2"],
    permissions: ["dashboard", "patients", "invoices"],
  },
];

export const secretariesFixture: Secretary[] = SECRETARIES.map((s, i) => ({
  id: `sec-${i + 1}`,
  nationalCode: s.nationalCode,
  phone: s.phone,
  fullName: s.fullName,
  isActive: i !== 5,
  secretaryScopes: s.placeIds.map((placeId) => ({
    place: {
      id: placeId,
      name: admissionPlacesFixture.find((p) => p.id === placeId)?.name ?? placeId,
    },
  })),
  secretaryPermissions: s.permissions.map((permissionKey, j) => ({
    id: `perm-${i + 1}-${j + 1}`,
    permissionKey,
  })),
  createdAt: new Date(2025, 0, 1 + i).toISOString(),
}));
