# VehicleTrack

VehicleTrack is a full-stack real-time vehicle tracking system built with React, Node.js, Express, MongoDB, and Socket.IO.
It supports role-based flows for admin, driver, and tracker users, with live location updates from drivers to trackers.

## Tech Stack

- Frontend: React (`client/`)
- Backend: Node.js + Express (`server/`)
- Database: MongoDB (Mongoose)
- Realtime: Socket.IO
- Auth: JWT + bcrypt

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+ (recommended)
- MongoDB connection URI

## Environment Variables

Create a `.env` file in the project root (you can copy from `.env.example`):

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Installation

From the project root:

```bash
npm run install-all
```

This installs dependencies for both the root server and the React client.

## Running in Development

Run backend + frontend together:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

You can also run parts separately:

```bash
npm run server   # backend only
npm run client   # frontend only
```

## Production Build and Start

Build client:

```bash
npm run build
```

Start production server (serves client build from Express):

```bash
npm start
```

## Project Structure

```text
VehicleTrack/
├── client/              # React app
│   ├── public/
│   └── src/
├── server/              # Express app + API routes
│   ├── middleware/
│   ├── models/
│   └── routes/
├── .env.example
└── package.json
```

## Main API Route Groups

- `/api/auth` - authentication
- `/api/admin` - admin operations
- `/api/driver` - driver operations
- `/api/tracker` - tracker operations

## Realtime Events (Socket.IO)

- Driver emits:
  - `driver:start-tracking`
  - `driver:location-update`
  - `driver:stop-tracking`
- Tracker emits:
  - `tracker:request-location`
  - `tracker:request-all-buses`
- Server emits:
  - `location:update`
  - `location:stop`
  - `location:all-buses`

## Notes

- Do not commit `.env` or secrets.
- `client/build` and cache artifacts should be ignored in git for clean commits.
