"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createNotification, fetchNotifications } from "@/features/notifications/api";
import type { CreateNotificationInput } from "@/features/notifications/types";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });
}

export function useCreateNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNotificationInput) => createNotification(input),
    onSuccess: () => {
      toast.success("اطلاعیه منتشر شد");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "خطا در انتشار اطلاعیه");
    },
  });
}
