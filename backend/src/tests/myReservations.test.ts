import { resolvers } from '../graphql/resolvers';
import { Reservation } from '../models/reservation';

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
      return res;
    }
  };
});

describe('myReservations ownership by guestName', () => {

  test('guest sees only their reservations', async () => {
    const rows = await (resolvers as any).Query.myReservations(null, {}, { user: { role: 'guest', sub: 'alice' } });
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].guestName).toBe('alice');
  });
});
