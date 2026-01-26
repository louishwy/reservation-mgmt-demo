import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import styles from '../styles.module.css';
import { useAuth } from '../../auth/AuthProvider';
import { setActiveRole as setActiveRoleInStore } from '../../apollo/tokenStore';

type Props = {
  role: 'guest' | 'employee';
  onSuccess?: () => void;
  endpoint?: string;
};

export default function LoginForm({ role, onSuccess, endpoint = 'http://localhost:4000/auth/login' }: Props) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const apollo = useApolloClient();
  const { refresh } = useAuth();

  const login = async () => {
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'login failed');
      const key = role === 'guest' ? 'guest_token' : 'employee_token';
      const nameKey = role === 'guest' ? 'guest_username' : 'employee_username';
      localStorage.setItem(key, json.token);
      setActiveRoleInStore(role);
      try {
        const parts = json.token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload && payload.sub) {
            localStorage.setItem(nameKey, payload.sub);
          } else {
            localStorage.setItem(nameKey, username);
          }
        } else {
          localStorage.setItem(nameKey, username);
        }
      } catch (err) {
        localStorage.setItem(nameKey, username);
      }
      try { await apollo.resetStore(); } catch (e) { }
      // refresh auth context
      try { refresh(); } catch (e) { }
      if (onSuccess) onSuccess();
      if (role === 'guest') navigate('/guest', { state: { loggedIn: true, t: Date.now() } });
      else navigate('/employee', { state: { loggedIn: true, t: Date.now() } });
    } catch (err: any) {
      setError(err.message || String(err));
    }
  };

  return (
    <div className={styles.form}>
      <h2>{role === 'guest' ? 'Guest Login (Demo)' : 'Employee Login (Demo)'}</h2>
      <div className={styles.field}><input className={styles.input} placeholder="username" value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div className={styles.field}><input className={styles.input} placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
      <div className={styles.smallNote}>{role === 'guest' ? 'Use demo credentials: Customer / Reservation123!' : 'Use demo credentials: Admin / 9800x3d'}</div>
      <div style={{ marginTop: 12 }}>
        <button className={styles.btn} onClick={login}>{role === 'guest' ? 'Login as Guest' : 'Login'}</button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>Error: {error}</div>}
    </div>
  );
}
