import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { isoToDatetimeLocal } from '../../lib/dates';

type ReservationInput = {
  id?: string;
  guestName?: string;
  guestContact?: { phone?: string; email?: string };
  arrivalTime?: string;
  tableSize?: number;
};

type Props = {
  reservation?: ReservationInput | null;
  onSaved?: () => void;
  fullWidth?: boolean;
};

const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: CreateReservationInput!) {
    createReservation(input: $input) {
      id
      guestName
      guestContact { phone email }
      arrivalTime
      tableSize
      status
    }
  }
`;

const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($id: ID!, $input: UpdateReservationInput!) {
    updateReservation(id: $id, input: $input) {
      id
      guestName
      guestContact { phone email }
      arrivalTime
      tableSize
      status
    }
  }
`;

export default function ReservationForm({ reservation, onSaved, fullWidth }: Props) {
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [tableSize, setTableSize] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { guestUsername } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const effectiveGuestName = guestUsername || guestName;
      if (reservation && reservation.id) {
        const res = await mutateUpdate({ variables: { id: reservation.id, input: { guestName: effectiveGuestName, guestContact: { phone, email }, arrivalTime, tableSize: Number(tableSize) } } });
        if ((res as any).error) throw (res as any).error;
        if (!(res as any).data) throw new Error('No data returned from update');
        setSuccess(true);
      } else {
        const res = await mutate({ variables: { input: { guestName: effectiveGuestName, guestContact: { phone, email }, arrivalTime, tableSize: Number(tableSize) } } });
        if ((res as any).error) throw (res as any).error;
        if (!(res as any).data) throw new Error('No data returned from mutation');
        setSuccess(true);
        setGuestName(''); setPhone(''); setEmail(''); setArrivalTime(''); setTableSize(2);
      }
      if (onSaved) onSaved();
    } catch (err: any) {
      const msg = err.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const [mutate] = useMutation(CREATE_RESERVATION as any);
  const [mutateUpdate] = useMutation(UPDATE_RESERVATION as any);

  useEffect(() => {
    if (reservation) {
      setGuestName(reservation.guestName || '');
      setPhone(reservation.guestContact?.phone || '');
      setEmail(reservation.guestContact?.email || '');
      setArrivalTime(isoToDatetimeLocal(reservation.arrivalTime || ''));
      setTableSize(reservation.tableSize || 2);
    }
  }, [reservation]);

  const rowStyle: React.CSSProperties = { display: 'flex', gap: 12, marginBottom: 8 };
  const colStyle: React.CSSProperties = { flex: 1 };
  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '6px 8px' };
  const disabledInputStyle: React.CSSProperties = { backgroundColor: '#f5f5f5', color: '#6b6b6b', cursor: 'not-allowed' };

  return (
    <div style={{ maxWidth: fullWidth ? '100%' : 400, margin: '2rem auto' }}>
      <form onSubmit={handleSubmit}>
        <h2>Book a Reservation</h2>
        {fullWidth ? (
          <>
            <div style={rowStyle}>
              <div style={colStyle}><input style={{ ...inputStyle, ...(guestUsername ? disabledInputStyle : {}) }} required placeholder="Name" value={guestUsername || guestName} onChange={e => setGuestName(e.target.value)} readOnly={!!guestUsername} disabled={!!guestUsername} /></div>
              <div style={colStyle}><input style={inputStyle} required placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
            <div style={rowStyle}>
              <div style={colStyle}><input style={inputStyle} required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div style={colStyle}><input style={inputStyle} required type="datetime-local" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 8 }}><input style={{ ...inputStyle, width: 120 }} required type="number" min={1} value={tableSize} onChange={e => setTableSize(Number(e.target.value))} /></div>
          </>
        ) : (
          <>
            <div><input style={{ ...inputStyle, ...(guestUsername ? disabledInputStyle : {}) }} required placeholder="Name" value={guestUsername || guestName} onChange={e => setGuestName(e.target.value)} readOnly={!!guestUsername} disabled={!!guestUsername} /></div>
            <div><input style={inputStyle} required placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><input style={inputStyle} required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><input style={inputStyle} required type="datetime-local" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} /></div>
            <div><input style={inputStyle} required type="number" min={1} value={tableSize} onChange={e => setTableSize(Number(e.target.value))} /></div>
          </>
        )}

        <div><button type="submit" disabled={loading}>Reserve</button></div>
      </form>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {success && <div style={{ color: 'green' }}>Reservation created!</div>}
    </div>
  );
}
