import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { setActiveRole as setActiveRoleInStore } from '../apollo/tokenStore';
import styles from './styles.module.css';

export default function AuthHeader() {
  const navigate = useNavigate();
  const { guestToken, guestUsername, employeeToken, employeeUsername, logoutGuest, logoutEmployee } = useAuth();
  const onLogoutGuest = () => {
    logoutGuest();
    // if employee token exists, switch active role to employee so authLink will use it
    if (employeeTok) setActiveRoleInStore('employee');
    else setActiveRoleInStore(null);
    navigate('/guest');
  };
  const onLogoutEmployee = () => {
    logoutEmployee();
    // if guest token exists, switch active role to guest so authLink will use it
    if (guestTok) setActiveRoleInStore('guest');
    else setActiveRoleInStore(null);
    navigate('/employee');
  };
  const guest = guestUsername;
  const guestTok = guestToken;
  const employee = employeeUsername;
  const employeeTok = employeeToken;

  return (
    <div className={styles.authArea}>
      {!guestTok ? (
        <Link to="/guest" onClick={() => setActiveRoleInStore('guest')}>Guest Login</Link>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Guest: <strong>{guest}</strong></span>
          <button onClick={onLogoutGuest}>Logout</button>
        </div>
      )}

      {!employeeTok ? (
        <Link to="/employee" onClick={() => setActiveRoleInStore('employee')}>Employee Login</Link>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Employee: <strong>{employee}</strong></span>
          <button onClick={onLogoutEmployee}>Logout</button>
        </div>
      )}
    </div>
  );
}
