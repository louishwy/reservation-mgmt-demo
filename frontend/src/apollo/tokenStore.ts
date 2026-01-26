type Role = 'guest' | 'employee' | null;

let activeRole: Role = (typeof localStorage !== 'undefined' && localStorage.getItem('active_role')) as Role || null;

export function getActiveRole(): Role {
  return activeRole;
}

export function setActiveRole(role: Role) {
  activeRole = role;
  try {
    if (role) localStorage.setItem('active_role', role);
    else localStorage.removeItem('active_role');
  } catch (err) { }
}

export function getAuthToken(): string | null {
  try {
    if (activeRole === 'employee') {
      const t = (typeof localStorage !== 'undefined' && localStorage.getItem('employee_token')) || null;
      console.debug('[tokenStore] activeRole=employee, token?', !!t);
      return t;
    }
    if (activeRole === 'guest') {
      const t = (typeof localStorage !== 'undefined' && localStorage.getItem('guest_token')) || null;
      console.debug('[tokenStore] activeRole=guest, token?', !!t);
      return t;
    }
    // fallback - prefer guest then employee
    const t = (typeof localStorage !== 'undefined' && (localStorage.getItem('guest_token') || localStorage.getItem('employee_token'))) || null;
    console.debug('[tokenStore] activeRole=unset, picking guest?employee, token?', !!t);
    return t;
  } catch (err) {
    return null;
  }
}

const tokenStore = {
  getActiveRole,
  setActiveRole,
  getAuthToken,
};

export default tokenStore;
