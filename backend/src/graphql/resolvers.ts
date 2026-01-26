
import { Reservation, ReservationStatus } from '../models/reservation';
import { v4 as uuidv4 } from 'uuid';
import * as cb from '../db';

function mergeGuestContact(existing: any, incoming?: any) {
  if (!incoming) return existing;
  return {
    phone: incoming.phone ?? existing.phone,
    email: incoming.email ?? existing.email
  };
}
export const resolvers = {
  Query: {
    reservations: async (_: any, args: { filter?: { date?: string; status?: ReservationStatus }; date?: string; status?: ReservationStatus }) => {
      if (!cb.isConnected()) throw new Error('Database not connected');
      const date = args.filter?.date ?? args.date;
      const status = args.filter?.status ?? args.status;
      return await cb.queryReservationsByDateStatusAndOwner(date, status as any, undefined);
    },
    adminReservations: async (_: any, args: { filter?: { date?: string; status?: ReservationStatus }; date?: string; status?: ReservationStatus }, context: any) => {
      const user = context?.user;
      if (!user || user.role !== 'employee') throw new Error('Unauthorized: employee required');
      if (!cb.isConnected()) throw new Error('Database not connected');
      const date = args.filter?.date ?? args.date;
      const status = args.filter?.status ?? args.status;
      return await cb.queryReservationsByDateStatusAndOwner(date, status as any, undefined);
    },
    myReservations: async (_: any, _args: any, context: any) => {
      const user = context?.user;
      if (!user) throw new Error('Unauthorized: login required');
      if (!cb.isConnected()) throw new Error('Database not connected');
      const guestName = user.role === 'guest' ? user.sub : undefined;
      return await cb.queryReservationsByDateStatusAndOwner(undefined, undefined, guestName);
    },
    reservation: async (_: any, { id }: { id: string }) => {
      if (!cb.isConnected()) throw new Error('Database not connected');
      const r = await cb.getReservationById(id);
      return r;
    }
  },
  Mutation: {
    createReservation: async (_: any, { input }: any, context: any) => {
      const { guestName, guestContact, arrivalTime, tableSize } = input;
      if (!guestName || !guestContact || !guestContact.phone || !guestContact.email || !arrivalTime || !tableSize) {
        throw new Error('Missing required fields');
      }
      if (!cb.isConnected()) throw new Error('Database not connected');
      const newReservation: Reservation = {
        id: uuidv4(),
        guestName,
        guestContact: { phone: guestContact.phone, email: guestContact.email },
        arrivalTime: new Date(arrivalTime).toISOString(),
        tableSize: Number(tableSize),
        status: 'REQUESTED'
      };
      await cb.upsertReservation(newReservation.id, newReservation);
      return newReservation;
    },
    updateReservation: async (_: any, { id, input }: any) => {
      if (!cb.isConnected()) throw new Error('Database not connected');
      const existing = await cb.getReservationById(id);
      if (!existing) throw new Error('Reservation not found');
      const newArrival = input.arrivalTime ? new Date(input.arrivalTime).toISOString() : existing.arrivalTime;
      const newTableSize = input.tableSize !== undefined ? Number(input.tableSize) : existing.tableSize;
      const updated: Reservation = {
        ...existing,
        guestName: input.guestName ?? existing.guestName,
        guestContact: mergeGuestContact(existing.guestContact, input.guestContact),
        arrivalTime: newArrival,
        tableSize: newTableSize
      };
      await cb.upsertReservation(id, updated);
      return updated;
    },
    cancelReservation: async (_: any, { id }: { id: string }, _context: any) => {
      if (!cb.isConnected()) throw new Error('Database not connected');
      const existing = await cb.getReservationById(id);
      if (!existing) throw new Error('Reservation not found');
      existing.status = 'CANCELLED';
      await cb.upsertReservation(id, existing);
      return existing;
    },
    updateReservationStatus: async (_: any, { id, status }: { id: string; status: ReservationStatus }, context: any) => {
      const valid: ReservationStatus[] = ['REQUESTED', 'APPROVED', 'CANCELLED', 'COMPLETED'];
      if (!valid.includes(status)) throw new Error('Invalid status');

      const user = context?.user;
      if (!user || user.role !== 'employee') throw new Error('Unauthorized: employee role required');
      if (!cb.isConnected()) throw new Error('Database not connected');
      const existing = await cb.getReservationById(id);
      if (!existing) throw new Error('Reservation not found');
      existing.status = status;
      await cb.upsertReservation(id, existing);
      return existing;
    }
  }
};
