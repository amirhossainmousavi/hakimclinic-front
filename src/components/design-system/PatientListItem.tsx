import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/design-system/StatusBadge";
import type { Patient } from "@/features/patients/types";

interface PatientListItemProps {
  patient: Patient;
  action?: React.ReactNode;
}

export function PatientListItem({ patient, action }: PatientListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition-all duration-200 hover:border-primary/30 hover:shadow-soft">
      <Avatar className="size-11 ring-2 ring-primary/10">
        <AvatarFallback className="gradient-primary font-semibold text-white">
          {patient.fullName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-semibold">{patient.fullName}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {patient.fileNumber} • {patient.nationalCode}
        </p>
        <StatusBadge status={patient.status} />
      </div>
      {action}
    </div>
  );
}
