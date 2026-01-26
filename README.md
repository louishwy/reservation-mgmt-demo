# reservation-mgmt-demo

This repository contains a small reservations demo with two folders:

- `backend/` — Node.js + TypeScript backend using Apollo GraphQL and MongoDB.
- `frontend/` — React + TypeScript frontend using Apollo Client.

This README explains how to set up and run the service locally.

## Prerequisites

- Node.js (>=16)
- Local MongoDB (or run the provided Docker Compose which starts MongoDB)

## Demo credentials

- Employee: username: `Admin`, password: `9800x3d`
- Guest: username: `Customer`, password: `Reservation123!`

## MongoDB

Default MongoDB config (can be changed in `backend/src/db/index.ts`):

- connectionString: `mongodb://mongo:27017` or set `MONGO_URI`
- username: `Administrator` (set via `MONGO_INITDB_ROOT_USERNAME`)
- password: `9800x3d` (set via `MONGO_INITDB_ROOT_PASSWORD`)
- database: `reservations_db` (set via `MONGO_DB_NAME`)
- collection: `reservations` (set via `MONGO_COLLECTION_NAME`)
 
### Start with Docker Compose

Use the standard Docker Compose commands to run the demo. The simplest workflow is:

```bash
cd "./reservation-mgmt-demo"
docker compose up --build -d
```

Then follow logs to watch services start:

```bash
docker compose logs -f
# or follow a specific service:
docker compose logs -f mongo
docker compose logs -f backend
docker compose logs -f frontend
```

### Demo endpoint
- Frontend: localhost:3000
- Backend: localhost:4000/graphql
