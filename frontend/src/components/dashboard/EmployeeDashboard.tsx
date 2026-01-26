import ReservationList from '../reservations/ReservationList';
import EmployeeLogin from '../auth/EmployeeLogin';
import styles from '../styles.module.css';
import { useAuth } from '../../auth/AuthProvider';
import { useApolloClient } from '@apollo/client/react';

export default function EmployeeDashboard() {
  const apollo = useApolloClient();
  const { employeeToken, refresh } = useAuth();
  const token = employeeToken;

  const onLoggedIn = async () => {
    refresh();
    try { await apollo.resetStore(); } catch (e) { }
  };

  return (
    <div className={styles.container}>
      <h2>Employee Dashboard (Demo)</h2>
      {!token ? (
        <EmployeeLogin onLoggedIn={onLoggedIn} />
      ) : (
        <ReservationList />
      )}
    </div>
  );
}
