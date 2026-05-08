import { useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationType } from '@/types/hotel';

export function useNotificationCreator() {
  const { createNotification } = useNotifications();

  const notifyNewBooking = useCallback((bookingId: string, guestName: string, roomName: string) => {
    createNotification({
      userId: null, // null means all admins/staff see it
      title: 'New Booking Received',
      message: `${guestName} booked ${roomName}`,
      type: 'booking' as NotificationType,
      relatedId: bookingId,
      read: false,
    });
  }, [createNotification]);

  const notifyPaymentReceived = useCallback((paymentId: string, guestName: string, amount: number) => {
    createNotification({
      userId: null,
      title: 'Payment Confirmed',
      message: `Received $${amount} from ${guestName}`,
      type: 'payment' as NotificationType,
      relatedId: paymentId,
      read: false,
    });
  }, [createNotification]);

  const notifyGuestNoteAdded = useCallback((bookingId: string, staffName: string, roomName: string) => {
    createNotification({
      userId: null,
      title: 'Guest Note Added',
      message: `${staffName} added a note to ${roomName}`,
      type: 'guest_note' as NotificationType,
      relatedId: bookingId,
      read: false,
    });
  }, [createNotification]);

  const notifyContactMessage = useCallback((messageId: string, senderName: string, subject: string) => {
    createNotification({
      userId: null,
      title: 'New Contact Message',
      message: `${senderName}: ${subject}`,
      type: 'contact_message' as NotificationType,
      relatedId: messageId,
      read: false,
    });
  }, [createNotification]);

  const notifyCheckIn = useCallback((bookingId: string, guestName: string, roomName: string) => {
    createNotification({
      userId: null,
      title: 'Guest Checked In',
      message: `${guestName} checked into ${roomName}`,
      type: 'booking' as NotificationType,
      relatedId: bookingId,
      read: false,
    });
  }, [createNotification]);

  const notifyCheckOut = useCallback((bookingId: string, guestName: string, roomName: string) => {
    createNotification({
      userId: null,
      title: 'Guest Checked Out',
      message: `${guestName} checked out of ${roomName}`,
      type: 'booking' as NotificationType,
      relatedId: bookingId,
      read: false,
    });
  }, [createNotification]);

  const notifyRoomStatusChange = useCallback((roomId: string, roomName: string, newStatus: string) => {
    createNotification({
      userId: null,
      title: 'Room Status Updated',
      message: `${roomName} is now ${newStatus}`,
      type: 'system' as NotificationType,
      relatedId: roomId,
      read: false,
    });
  }, [createNotification]);

  return {
    notifyNewBooking,
    notifyPaymentReceived,
    notifyGuestNoteAdded,
    notifyContactMessage,
    notifyCheckIn,
    notifyCheckOut,
    notifyRoomStatusChange,
  };
}
