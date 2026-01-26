import { loginHandler } from '../routes/auth';
import { verifyToken, extractUserFromHeader } from '../middleware/auth';
import { resolvers } from '../graphql/resolvers';

// Mock DB for tests
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

function makeReq(body: any = {}) {
  return { body, headers: {} } as any;
}

function makeRes() {
  const res: any = {};
  res.status = (s: number) => { res._status = s; return res; };
  res.json = (p: any) => { res._json = p; return res; };
  return res;
}

describe('auth login and token helpers', () => {
  test('login returns token for valid credentials', () => {
    process.env.DEMO_USER = 'Admin';
    process.env.DEMO_PASS = '9800x3d';
    process.env.DEMO_GUEST_USER = 'Customer';
    process.env.DEMO_GUEST_PASS = 'Reservation123!';
    const req = makeReq({ username: 'Admin', password: '9800x3d' });
    const res = makeRes();
    loginHandler(req, res as any);
    expect(res._json).toBeDefined();
    expect(typeof res._json.token).toBe('string');
  });

  test('guest login returns token for guest credentials', () => {
    process.env.DEMO_GUEST_USER = 'Customer';
    process.env.DEMO_GUEST_PASS = 'Reservation123!';
    const req = makeReq({ username: 'Customer', password: 'Reservation123!' });
    const res = makeRes();
    loginHandler(req, res as any);
    expect(res._json).toBeDefined();
    expect(typeof res._json.token).toBe('string');
  });

  test('login rejects invalid credentials', () => {
    const req = makeReq({ username: 'bad', password: 'nope' });
    const res = makeRes();
    loginHandler(req, res as any);
    expect(res._status).toBe(401);
    expect(res._json).toBeDefined();
  });

  test('verifyToken and extractUserFromHeader work together', () => {
    process.env.JWT_SECRET = 'dev-secret';
    process.env.DEMO_USER = 'Admin';
    process.env.DEMO_PASS = '9800x3d';
    const req = makeReq({ username: 'Admin', password: '9800x3d' });
    const res = makeRes();
    loginHandler(req, res as any);
    const token = res._json.token as string;
    const payload = verifyToken(token);
    expect(payload).toBeDefined();
    const hdr = `Bearer ${token}`;
    const extracted = extractUserFromHeader(hdr);
    expect(extracted).toBeDefined();
    expect(extracted.sub).toBe('Admin');
  });

  test('adminReservations rejects without employee and allows with employee', async () => {
    await resolvers.Mutation.createReservation(null, { input: { guestName: 'A', guestContact: { phone: '1', email: 'a@b.c' }, arrivalTime: new Date(Date.now() + 86400000).toISOString(), tableSize: 2 } }, { user: { role: 'guest', sub: 'guest' } });
    await expect(resolvers.Query.adminReservations(null, {} as any, {})).rejects.toThrow(/Unauthorized/);
    const req = makeReq({ username: 'Admin', password: '9800x3d' });
    const res = makeRes();
    loginHandler(req, res as any);
    const token = res._json.token as string;
    const payload = verifyToken(token);
    const rows: any = await resolvers.Query.adminReservations(null, {}, { user: payload });
    expect(Array.isArray(rows)).toBe(true);
  });
});
