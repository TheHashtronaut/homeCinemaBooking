export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
};

export type Movie = {
  id: string;
  title: string | null;
  posterUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Showtime = {
  id: string;
  movieId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  approvedCount?: number;
  remaining?: number;
  createdAt: string;
  updatedAt: string;
};

export type BookingRequest = {
  id: string;
  showtimeId: string;
  customerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

