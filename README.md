# Kluster (Felicity Event Management System)

Full-stack event management platform with role-based flows for Participant, Organizer, and Admin.

## Tech Stack

- Frontend: Next.js, React, TypeScript, shadcn/ui
- Backend: Express, TypeScript, Mongoose, Zod, JWT, bcrypt
- Database: MongoDB
- Email: Nodemailer (SMTP)

## Repository Structure

- `backend/` - API server, routes, models, validation, middleware
- `frontend/` - Next.js app (App Router), pages, UI components, API client

## Environment Variables

### Backend (`backend/.env`)

Set these variables:

```env
MONGO_URI=
appName=
PORT=
JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
EMAIL_PASS=
EMAIL_USER=
EMAIL_PORT=
EMAIL_HOST=
EMAIL_SECURE=
EMAIL_FROM=
```

Notes:
- `MONGO_URI`, `JWT_SECRET`, and `EMAIL_PASS` must be filled for full functionality.
- For Gmail SMTP, `EMAIL_PASS` should be an app password.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Local Setup

1. Install dependencies
   - `cd backend && npm install`
   - `cd ../frontend && npm install`
2. Create environment files
   - `backend/.env`
   - `frontend/.env.local`
3. Run backend
   - `cd ../backend && npm run dev`
4. Run frontend
   - `cd ../frontend && npm run dev`
5. Open `http://localhost:3000`

## Scripts

### Backend

- `npm run dev` - start development server with `tsx` + `nodemon`
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server

### Frontend

- `npm run dev` - start Next.js dev server
- `npm run lint` - run ESLint
- `npm run build` - production build
- `npm run start` - run production server

## API Route Groups

- `/auth`
- `/events`
- `/registrations`
- `/participants`
- `/organizer`
- `/admin`
