import styles from './components/styles.module.css';
import { Routes, Route, Link } from 'react-router-dom';
import { setActiveRole as setActiveRoleInStore } from './apollo/tokenStore';
import AuthHeader from './components/AuthHeader';
import ReservationList from './components/reservations/ReservationList';
import ReservationDetail from './components/reservations/ReservationDetail';
import GuestDashboard from './components/dashboard/GuestDashboard';

function App() {
  

  return (
    <div>
      <nav className={styles.nav}>
        <div className={styles.navLinks}>
          <Link to="/guest" onClick={() => setActiveRoleInStore('guest')}>Guest Dashboard</Link>
          <Link to="/employee" onClick={() => setActiveRoleInStore('employee')}>Employee Dashboard</Link>
        </div>
        <div className={styles.authArea}>
          <AuthHeader />
        </div>
      </nav>
      <Routes>
        <Route path="/guest" element={<GuestDashboard />} />
        <Route path="/employee" element={<ReservationList />} />
        <Route path="/employee/:id" element={<ReservationDetail />} />
        <Route
          path="*"
          element={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', fontSize: '1.25rem' }}>
              Welcome to Reservation Management Demo
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
