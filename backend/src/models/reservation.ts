export interface GuestContact {
  phone: string;
  email: string;
}

export type ReservationStatus = 'REQUESTED' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  guestName: string;
  guestContact: GuestContact;
  arrivalTime: string;
  tableSize: number;
  status: ReservationStatus;
}
