import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setActiveRole as setActiveRoleInStore } from '../apollo/tokenStore';

type AuthContextType = {
  guestToken: string | null;
  guestUsername: string | null;
  employeeToken: string | null;
  employeeUsername: string | null;
  refresh: () => void;
  logoutGuest: () => void;
  logoutEmployee: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestToken, setGuestToken] = useState<string | null>(localStorage.getItem('guest_token'));
  const [guestUsername, setGuestUsername] = useState<string | null>(localStorage.getItem('guest_username'));
  const [employeeToken, setEmployeeToken] = useState<string | null>(localStorage.getItem('employee_token'));
  const [employeeUsername, setEmployeeUsername] = useState<string | null>(localStorage.getItem('employee_username'));

  function decodeJwtPayload(token?: string) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      // decode base64url -> base64
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(b64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch (err) {
      return null;
    }
  }

  const refresh = useCallback(() => {
    setGuestToken(localStorage.getItem('guest_token'));
    // derive username from token subject (sub) when possible
    const gTok = localStorage.getItem('guest_token');
    const gPayload: any = decodeJwtPayload(gTok || undefined);
    if (gPayload && gPayload.sub) setGuestUsername(gPayload.sub);
    else setGuestUsername(localStorage.getItem('guest_username'));
    setEmployeeToken(localStorage.getItem('employee_token'));
    const eTok = localStorage.getItem('employee_token');
    const ePayload: any = decodeJwtPayload(eTok || undefined);
    if (ePayload && ePayload.sub) setEmployeeUsername(ePayload.sub);
    else setEmployeeUsername(localStorage.getItem('employee_username'));
  }, []);

  const logoutGuest = () => {
    localStorage.removeItem('guest_token');
    localStorage.removeItem('guest_username');
    // if employee token exists, switch active role to employee, else clear
    if (localStorage.getItem('employee_token')) setActiveRoleInStore('employee');
    else setActiveRoleInStore(null);
    refresh();
  };

  const logoutEmployee = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_username');
    // if guest token exists, switch active role to guest, else clear
    if (localStorage.getItem('guest_token')) setActiveRoleInStore('guest');
    else setActiveRoleInStore(null);
    refresh();
  };

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ guestToken, guestUsername, employeeToken, employeeUsername, refresh, logoutGuest, logoutEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
