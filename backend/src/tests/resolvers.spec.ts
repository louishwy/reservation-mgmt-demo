import { resolvers } from '../graphql/resolvers';
import { Reservation } from '../models/reservation';

// Mock DB module used by resolvers. Tests will use an in-memory array
jest.mock('../db', () => {
  let store: Reservation[] = [];
  return {
    connect: async () => ({ cluster: {} as any, collection: {} as any }),
    isConnected: () => true,
    upsertReservation: async (id: string, doc: Reservation) => {
      const idx = store.findIndex(s => s.id === id);
      if (idx >= 0) store[idx] = doc;
      else store.push(doc);
      return doc;
    },
    getReservationById: async (id: string) => store.find(r => r.id === id) ?? null,
    queryReservationsByDateStatusAndOwner: async (date?: string, status?: string, guestName?: string) => {
      let res = store.slice();
      if (date) res = res.filter(r => r.arrivalTime.slice(0, 10) === date.slice(0, 10));
      if (status) res = res.filter(r => r.status === status);
      if (guestName) res = res.filter(r => r.guestName === guestName);
      res.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
      return res;
    },
    __test__: {
      resetInMemory: () => { store = []; },
      seedInMemory: (items: Reservation[]) => { store = items.slice(); }
    }
  };
});

const cb: any = require('../db');

describe('Reservation resolvers (mocked db)', () => {
  test('createReservation should create a reservation', async () => {
    const input = {
      guestName: 'Test Guest',
      guestContact: { phone: '555-0001', email: 'test@example.com' },
      arrivalTime: new Date().toISOString(),
      tableSize: 3
    };
    const res = await (resolvers as any).Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest' } });
    expect(res).toMatchObject({ guestName: 'Test Guest', tableSize: 3 });
  });

  test('updateReservation should update fields', async () => {
    cb.__test__.seedInMemory([{ id: 'r1', guestName: 'A', guestContact: { phone: 'p', email: 'e' }, arrivalTime: new Date().toISOString(), tableSize: 2, status: 'REQUESTED' }]);
    const updated = await (resolvers as any).Mutation.updateReservation(null, { id: 'r1', input: { guestName: 'B', tableSize: 5 } });
    expect(updated.guestName).toBe('B');
    expect(updated.tableSize).toBe(5);
  });

  test('cancelReservation should set status to CANCELLED', async () => {
    cb.__test__.seedInMemory([{ id: 'r2', guestName: 'C', guestContact: { phone: 'p', email: 'e' }, arrivalTime: new Date().toISOString(), tableSize: 2, status: 'REQUESTED' }]);
    const res = await (resolvers as any).Mutation.cancelReservation(null, { id: 'r2' }, { user: { role: 'employee', sub: 'employee' } });
    expect(res.status).toBe('CANCELLED');
  });

  test('updateReservationStatus should change status (employee action)', async () => {
    cb.__test__.seedInMemory([{ id: 'r3', guestName: 'D', guestContact: { phone: 'p', email: 'e' }, arrivalTime: new Date().toISOString(), tableSize: 2, status: 'REQUESTED' }]);
    const res = await (resolvers as any).Mutation.updateReservationStatus(null, { id: 'r3', status: 'APPROVED' }, { user: { role: 'employee', sub: 'employee' } });
    expect(res.status).toBe('APPROVED');
  });

  test('reservations query should filter by date and status', async () => {
    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const r1 = { id: 'a', guestName: 'x', guestContact: { phone: 'p', email: 'e' }, arrivalTime: iso(now), tableSize: 2, status: 'REQUESTED' } as Reservation;
    const r2 = { id: 'b', guestName: 'y', guestContact: { phone: 'p', email: 'e' }, arrivalTime: iso(new Date(now.getTime() + 86400000)), tableSize: 2, status: 'APPROVED' } as Reservation;
    cb.__test__.seedInMemory([r1, r2]);
    const listAll = await (resolvers as any).Query.reservations(null, {});
    expect(listAll.length).toBe(2);
    const byDate = await (resolvers as any).Query.reservations(null, { filter: { date: iso(now).slice(0, 10) } });
    expect(byDate.length).toBe(1);
    const byStatus = await (resolvers as any).Query.reservations(null, { filter: { status: 'APPROVED' } });
    expect(byStatus.length).toBe(1);
  });

  test('myReservations returns only owner reservations for guest', async () => {
    const base1: Reservation = { id: 'g1', guestName: 'alice', guestContact: { phone: 'p', email: 'e' }, arrivalTime: new Date().toISOString(), tableSize: 2, status: 'REQUESTED' };
    const base2: Reservation = { id: 'g2', guestName: 'bob', guestContact: { phone: 'p', email: 'e' }, arrivalTime: new Date().toISOString(), tableSize: 2, status: 'REQUESTED' };
    cb.__test__.seedInMemory([base1, base2]);
    const rows = await (resolvers as any).Query.myReservations(null, {}, { user: { role: 'guest', sub: 'alice' } });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe('g1');
  });
});
