import { resolvers } from '../graphql/resolvers';
// Mock DB helper for tests
jest.mock('../db', () => {
  let store: any[] = [];
  return {
    connect: async () => ({}),
    isConnected: () => true,
    upsertReservation: async (id: string, doc: any) => { const i = store.findIndex(s => s.id === id); if (i >= 0) store[i] = doc; else store.push(doc); return doc; },
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

describe('reservation CRUD and status flows', () => {
  test('create and read reservation', async () => {
    const now = new Date();
    const arrival = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const input = { guestName: 'Test', guestContact: { phone: '1', email: 'a@b.c' }, arrivalTime: arrival, tableSize: 2 };
    const created: any = await resolvers.Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest' } });
    expect(created).toBeDefined();
    const fetched: any = await resolvers.Query.reservation(null, { id: created.id });
    expect(fetched).toBeDefined();
    expect(fetched.guestName).toBe('Test');
  });

  test('update and cancel flows', async () => {
    const now = new Date();
    const arrival = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const input = { guestName: 'ToUpdate', guestContact: { phone: '2', email: 'u@b.c' }, arrivalTime: arrival, tableSize: 2 };
    const created: any = await resolvers.Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest' } });
    const updated: any = await resolvers.Mutation.updateReservation(null, { id: created.id, input: { guestName: 'Updated' } });
    expect(updated.guestName).toBe('Updated');
    const { loginHandler } = require('../routes/auth');
    const lr = { body: { username: 'employee', password: 'password' } } as any;
    const lres = { status: () => lres, json: (p: any) => { lres._json = p; return lres; } } as any;
    loginHandler(lr, lres as any);
    const token = lres._json?.token;
    const { verifyToken } = require('../middleware/auth');
    const payload = verifyToken(token);
    const cancelled: any = await resolvers.Mutation.cancelReservation(null, { id: created.id }, { user: payload });
    expect(cancelled.status).toBe('CANCELLED');
  });

  test('employee can update status', async () => {
    const now = new Date();
    const arrival = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const input = { guestName: 'Worker', guestContact: { phone: '3', email: 'w@b.c' }, arrivalTime: arrival, tableSize: 2 };
    const created: any = await resolvers.Mutation.createReservation(null, { input }, { user: { role: 'guest', sub: 'guest' } });
    const changed: any = await resolvers.Mutation.updateReservationStatus(null, { id: created.id, status: 'APPROVED' }, { user: { role: 'employee', sub: 'employee' } });
    expect(changed.status).toBe('APPROVED');
  });
});
