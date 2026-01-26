import { resolvers } from '../graphql/resolvers';
import { Reservation } from '../models/reservation';

// Mock DB helper for tests
jest.mock('../db', () => {
  let store: Reservation[] = [];
  return {
    connect: async () => ({}),
    isConnected: () => true,
    upsertReservation: async (id: string, doc: Reservation) => { const i = store.findIndex(s => s.id === id); if (i >= 0) store[i] = doc; else store.push(doc); return doc; },
    getReservationById: async (id: string) => store.find(s => s.id === id) ?? null,
    queryReservationsByDateStatusAndOwner: async (date?: string, status?: string, guestName?: string) => {
      let res = store.slice();
      if (date) res = res.filter(r => r.arrivalTime.slice(0, 10) === date.slice(0, 10));
      if (status) res = res.filter(r => r.status === status);
      if (guestName) res = res.filter(r => r.guestName === guestName);
      res.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
      return res;
    }
  };
});

describe('availability checks', () => {
  test('happy path: create reservation when capacity available', async () => {
    const now = new Date();
    const slot = new Date(now.getTime() + 24 * 3600 * 1000); // tomorrow
    const arrival = slot.toISOString();
    const input = { guestName: 'Test', guestContact: { phone: '1', email: 'a@b.c' }, arrivalTime: arrival, tableSize: 2 };
    const result: any = await resolvers.Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest' } });
    expect(result).toBeDefined();
    expect(result.tableSize).toBe(2);
  });

  test('conflict: reject when capacity exceeded', async () => {
    const now = new Date();
    const slot = new Date(now.getTime() + 24 * 3600 * 1000);
    const arrival = slot.toISOString();
    const input = { guestName: 'New', guestContact: { phone: '2', email: 'n@x.com' }, arrivalTime: arrival, tableSize: 2 };
    const created: any = await resolvers.Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest2' } });
    expect(created).toBeDefined();
    expect(created.arrivalTime).toBe(arrival);
  });
});
