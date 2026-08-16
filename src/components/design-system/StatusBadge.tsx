import { Badge } from "@/components/ui/badge";
import { PATIENT_STATUS_LABELS, type PatientStatus } from "@/features/patients/types";

const STATUS_VARIANT: Record<PatientStatus, "warning" | "default" | "success" | "outline"> = {
  admitted: "success",
  pending_insurance_approval: "warning",
  in_production: "default",
  ready_for_delivery: "outline",
  delivered: "success",
};

const STATUS_DOT: Record<PatientStatus, string> = {
  admitted: "bg-success",
  pending_insurance_approval: "bg-warning",
  in_production: "bg-primary",
  ready_for_delivery: "bg-indigo-500",
  delivered: "bg-success",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className="gap-1.5">
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]} ${status === "in_production" ? "animate-pulse" : ""}`} />
      {PATIENT_STATUS_LABELS[status]}
    </Badge>
  );
}
