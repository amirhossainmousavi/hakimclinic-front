export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  createdByUserName: string;
  admissionPlaceId?: string | null;
  admissionPlaceName?: string | null;
}

export interface CreateNotificationInput {
  message: string;
  admissionPlaceId?: string | null;
}
