import { useParams } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { formatGqlError } from '../../apollo/graphqlHelpers';
import { formatLocalDatetime } from '../../lib/dates';

const GET_RESERVATION = gql`
  query Reservation($id: ID!) {
    reservation(id: $id) {
      id
      guestName
      guestContact { phone email }
      arrivalTime
      tableSize
      status
    }
  }
`;


export default function ReservationDetail() {
  const { id } = useParams();

  const { data, loading, error } = useQuery(GET_RESERVATION as any, { variables: { id }, fetchPolicy: 'network-only' });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {formatGqlError(error)}</div>;
  if (!(data as any)?.reservation) return <div>Not found</div>;

  const r = (data as any).reservation;

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Reservation Detail</h2>
      <div><b>Name:</b> {r.guestName}</div>
      <div><b>Phone:</b> {r.guestContact.phone}</div>
      <div><b>Email:</b> {r.guestContact.email}</div>
      <div><b>Arrival Time:</b> {formatLocalDatetime(r.arrivalTime)}</div>
      <div><b>Table Size:</b> {r.tableSize}</div>
      <div><b>Status:</b> {r.status}</div>
    </div>
  );
}
