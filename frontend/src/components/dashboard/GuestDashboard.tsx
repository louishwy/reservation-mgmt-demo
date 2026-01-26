import * as React from 'react';
import { gql } from '@apollo/client';
import { useApolloClient, useQuery, useMutation } from '@apollo/client/react';
import { formatGqlError } from '../../apollo/graphqlHelpers';
import ReservationForm from '../forms/ReservationForm';
import GuestLogin from '../auth/GuestLogin';
import { useAuth } from '../../auth/AuthProvider';
import styles from '../styles.module.css';
import { formatLocalDatetime } from '../../lib/dates';

const MY_RESERVATIONS = gql`
  query MyReservations {
        myReservations { id guestName arrivalTime tableSize status guestContact { phone email } }
  }
`;

const CANCEL_RESERVATION = gql`
  mutation CancelReservation($id: ID!) {
    cancelReservation(id: $id) { id status }
  }
`;

export default function GuestDashboard() {
    const apollo = useApolloClient();
    const { guestToken, guestUsername, refresh } = useAuth();
    const [token, setToken] = React.useState<string | null>(guestToken);
    const [, setUsername] = React.useState(guestUsername || '');
    const { data, error, refetch } = useQuery(MY_RESERVATIONS, { skip: !token, fetchPolicy: 'network-only' });
    const [mutateCancel] = useMutation(CANCEL_RESERVATION as any);

    const [editing, setEditing] = React.useState<any | null>(null);

    const onLoggedIn = async () => {
        refresh();
        setToken(localStorage.getItem('guest_token'));
        setUsername(localStorage.getItem('guest_username') || '');
        try { await apollo.resetStore(); } catch (e) { }
    };

    React.useEffect(() => {
        // keep local state in sync when auth context changes
        setToken(guestToken);
        setUsername(guestUsername || '');
    }, [guestToken, guestUsername]);

    const handleEdit = (r: any) => setEditing(r);

    const handleCancel = async (id: string) => {
        const ok = window.confirm('Are you sure you want to cancel this reservation?');
        if (!ok) return;
        try {
            await mutateCancel({ variables: { id } });
            if (editing && editing.id === id) setEditing(null);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const onSaved = () => { setEditing(null); refetch(); };

    return (
        <div className={styles.container}>
            {!token ? (
                <GuestLogin onLoggedIn={onLoggedIn} />
            ) : null}
            {error && <div style={{ color: 'red' }}>{formatGqlError(error as any)}</div>}
            {token && (
                <div>
                    {editing ? (
                        <div>
                            <h3>Editing Reservation</h3>
                            <ReservationForm reservation={editing} onSaved={onSaved} fullWidth />
                            <div style={{ marginTop: 8 }}><button onClick={() => setEditing(null)}>Cancel Edit</button></div>
                        </div>
                    ) : (
                        <div className={styles.fullWidth}><ReservationForm onSaved={onSaved} fullWidth /></div>
                    )}

                    {(data as any) && (
                        <div style={{ marginTop: 16 }}>
                            <h3>Your Reservations</h3>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Arrival</th>
                                        <th>Table</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {((data as any).myReservations as any[]).map((r: any) => (
                                        <tr key={r.id}>
                                            <td>{r.guestName}</td>
                                            <td>{formatLocalDatetime(r.arrivalTime)}</td>
                                            <td>{r.tableSize}</td>
                                            <td>{r.status}</td>
                                            <td>
                                                {r.status !== 'CANCELLED' ? (
                                                    <>
                                                        <button onClick={() => handleEdit(r)}>Edit</button>
                                                        <button onClick={() => handleCancel(r.id)} style={{ marginLeft: 8 }}>Cancel</button>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#888' }}>Cancelled</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
