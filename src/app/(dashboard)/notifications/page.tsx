"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, MessageSquareText, Send } from "lucide-react";
import { PageHeader } from "@/components/design-system/PageHeader";
import { ErrorState } from "@/components/design-system/ErrorState";
import { EmptyState } from "@/components/design-system/EmptyState";
import { NotificationsSkeleton } from "@/components/skeletons/NotificationsSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCreateNotification, useNotifications } from "@/features/notifications/hooks";
import { useAuth } from "@/features/auth/context";
import { useAdmissionPlaces } from "@/features/admission-places/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [admissionPlaceId, setAdmissionPlaceId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useNotifications();
  const createMutation = useCreateNotification();
  const { data: places } = useAdmissionPlaces();

  const send = async () => {
    if (!message.trim()) return;
    await createMutation.mutateAsync({
      message,
      admissionPlaceId: admissionPlaceId || null,
    });
    setMessage("");
    setAdmissionPlaceId("");
    setOpen(false);
  };

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="اطلاعیه‌ها"
        description="اطلاعیه‌های داخلی کلینیک"
        breadcrumb={["پنل مدیریت", "اطلاعیه‌ها"]}
        actions={
          isManager ? (
            <Button onClick={() => setOpen(true)}>
              <Send className="size-4" />
              اطلاعیه جدید
            </Button>
          ) : (
            <Badge variant="secondary">
              <BellRing className="size-3.5" />
              {unread} خوانده‌نشده
            </Badge>
          )
        }
      />

      {isLoading ? (
        <NotificationsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => queryClient.invalidateQueries({ queryKey: ["notifications"] })} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="اطلاعیه‌ای وجود ندارد" description="اطلاعیه جدیدی هنوز منتشر نشده است." />
      ) : (
        <div className="space-y-3">
          {data.map((n) => (
            <Card key={n.id} className={`p-4 ${n.read ? "" : "border-primary/30 bg-primary/[0.03]"}`}>
              <div className="flex items-start gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                  {n.read ? <Bell className="size-4" /> : <BellRing className="size-4" />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>{n.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{n.createdByUserName}</span>
                    <span>•</span>
                    <span>{new Date(n.createdAt).toLocaleDateString("fa-IR")}</span>
                    {n.admissionPlaceName && (
                      <>
                        <span>•</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {n.admissionPlaceName}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <Badge variant="warning" className="text-[10px]">جدید</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اطلاعیه جدید</DialogTitle>
            <DialogDescription>
              محل پذیرش هدف را انتخاب کنید یا «همه» را برای ارسال به کل کلینیک بگذارید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ntf-place">محل پذیرش</Label>
              <Select
                value={admissionPlaceId}
                onValueChange={setAdmissionPlaceId}
              >
                <SelectTrigger id="ntf-place">
                  <SelectValue placeholder="همه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">همه</SelectItem>
                  {(places ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ntf-message">متن اطلاعیه</Label>
              <Input
                id="ntf-message"
                icon={MessageSquareText}
                placeholder="متن اطلاعیه را بنویسید…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button>
              <Button type="button" onClick={send} disabled={!message.trim() || createMutation.isPending}>
                <Send className="size-4" />
                انتشار اطلاعیه
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
