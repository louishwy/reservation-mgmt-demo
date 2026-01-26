
import gql from 'graphql-tag';

export const typeDefs = gql`
  type Reservation {
    id: ID!
    guestName: String!
    guestContact: GuestContact!
    arrivalTime: String!
    tableSize: Int!
    status: ReservationStatus!
  }

  type GuestContact {
    phone: String!
    email: String!
  }

  enum ReservationStatus {
    REQUESTED
    APPROVED
    CANCELLED
    COMPLETED
  }

  input GuestContactInput {
    phone: String!
    email: String!
  }

  input CreateReservationInput {
    guestName: String!
    guestContact: GuestContactInput!
    arrivalTime: String! # ISO 8601
    tableSize: Int!
  }

  input UpdateReservationInput {
    guestName: String
    guestContact: GuestContactInput
    arrivalTime: String
    tableSize: Int
  }

  input ReservationFilter {
    date: String # YYYY-MM-DD to match arrivalTime date portion
    status: ReservationStatus
  }

  type Query {
    reservations(filter: ReservationFilter, date: String, status: ReservationStatus): [Reservation!]!
    adminReservations(filter: ReservationFilter, date: String, status: ReservationStatus): [Reservation!]!
    myReservations: [Reservation!]!
    reservation(id: ID!): Reservation
  }

  type Mutation {
    createReservation(input: CreateReservationInput!): Reservation!
    updateReservation(id: ID!, input: UpdateReservationInput!): Reservation!
    cancelReservation(id: ID!): Reservation!
    updateReservationStatus(id: ID!, status: ReservationStatus!): Reservation!
  }
`;
