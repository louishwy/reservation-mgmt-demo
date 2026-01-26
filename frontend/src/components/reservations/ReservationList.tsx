import { Link } from 'react-router-dom';
import EmployeeLogin from '../auth/EmployeeLogin';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { formatGqlError } from '../../apollo/graphqlHelpers';
import styles from '../styles.module.css';
import { useState, useEffect } from 'react';
import { localDateToUtcDate, formatLocalDatetime } from '../../lib/dates';
import { useAuth } from '../../auth/AuthProvider';

const GET_RESERVATIONS = gql`
  query Reservations($date: String, $status: ReservationStatus) {
    reservations(date: $date, status: $status) {
      id
      guestName
      arrivalTime
      tableSize
      status
    }
  }
`;

const UPDATE_STATUS = gql`mutation UpdateStatus($id: ID!, $status: ReservationStatus!) { updateReservationStatus(id: $id, status: $status) { id status } }`;

export default function ReservationList() {
  const { employeeToken } = useAuth();
  const [dateFilter, setDateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const queryDate = localDateToUtcDate(dateFilter);
  const { data, loading, error, refetch } = useQuery(GET_RESERVATIONS as any, { fetchPolicy: 'network-only', variables: { date: queryDate || undefined, status: statusFilter || undefined } });
  const [mutateStatus] = useMutation(UPDATE_STATUS as any);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-apply filters whenever dateFilter or statusFilter changes
  useEffect(() => {
    refetch({ date: localDateToUtcDate(dateFilter) || undefined, status: statusFilter || undefined }).catch(() => { });
  }, [dateFilter, statusFilter, refetch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {formatGqlError(error)}</div>;

  if (!employeeToken) return <EmployeeLogin />;

  const updateStatus = async (id: string, status: 'APPROVED' | 'CANCELLED' | 'COMPLETED') => {
    if (status === 'CANCELLED') {
      const ok = window.confirm('Are you sure you want to cancel this reservation?');
      if (!ok) return;
    }
    try {
      setUpdatingId(id);
      const res = await mutateStatus({ variables: { id, status } });
      if ((res as any).error) throw (res as any).error;
      // refresh the list with current filters
      await refetch({ date: localDateToUtcDate(dateFilter) || undefined, status: statusFilter || undefined });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };


  return (
    <div className={styles.container}>
      <>
        <h2>Reservations</h2>
        <form style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div>
            <label style={{ marginRight: 6 }}>Date:</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </div>
          <div>
            <label style={{ marginRight: 6 }}>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="REQUESTED">REQUESTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div>
            <button type="button" style={{ marginLeft: 8 }} onClick={() => { setDateFilter(''); setStatusFilter(''); refetch({ date: undefined, status: undefined }).catch(() => { }); }}>Reset</button>
          </div>
        </form>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Arrival Time</th>
              <th>Table Size</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {((data as any)?.reservations || []).map((r: any) => (
              <tr key={r.id}>
                <td>{r.guestName}</td>
                <td>{formatLocalDatetime(r.arrivalTime)}</td>
                <td>{r.tableSize}</td>
                <td>{r.status}</td>
                <td>
                  <button onClick={() => updateStatus(r.id, 'APPROVED')} disabled={updatingId === r.id || r.status === 'APPROVED'}>Approve</button>
                  <button onClick={() => updateStatus(r.id, 'CANCELLED')} style={{ marginLeft: 8 }} disabled={updatingId === r.id || r.status === 'CANCELLED'}>Cancel</button>
                  <button onClick={() => updateStatus(r.id, 'COMPLETED')} style={{ marginLeft: 8 }} disabled={updatingId === r.id || r.status === 'COMPLETED'}>Complete</button>
                </td>
                <td><Link to={`/employee/${r.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    </div>
  );
}
