/** Persist "Réserver pour [proche]" intent across search → salon → booking. */
export const BOOKING_FOR_PROCHE_KEY = 'reza_booking_for_proche';

export type BookingForProche = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  relationship?: string;
};

export function setBookingForProche(proche: BookingForProche) {
  try {
    localStorage.setItem(BOOKING_FOR_PROCHE_KEY, JSON.stringify(proche));
  } catch {
    /* ignore */
  }
}

export function peekBookingForProche(): BookingForProche | null {
  try {
    const raw = localStorage.getItem(BOOKING_FOR_PROCHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingForProche;
  } catch {
    return null;
  }
}

export function clearBookingForProche() {
  try {
    localStorage.removeItem(BOOKING_FOR_PROCHE_KEY);
  } catch {
    /* ignore */
  }
}
