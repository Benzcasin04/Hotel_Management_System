# Hotel Management System - Backend

Express.js backend with Supabase integration for the Hotel Management System.

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── supabase.ts   # Supabase client setup
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   │   └── errorHandler.ts
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic & database operations
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions
│   └── index.ts          # Entry point
├── package.json
├── tsconfig.json
└── .env                  # Environment variables (not committed)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project details:
```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these from your [Supabase Dashboard](https://app.supabase.com) → Project Settings → API.

### 3. Run the Development Server

```bash
npm run dev
```

Server will start at `http://localhost:3000`

## Frontend Connection

The backend is configured to accept requests from your frontend at `http://localhost:8080`.

Update `frontend/.env` to point to the backend:
```env
VITE_API_URL=http://localhost:3000
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Supabase Setup

1. Create tables in Supabase for:
   - `users` - User accounts (extends Supabase Auth)
   - `rooms` - Hotel rooms inventory
   - `bookings` - Reservation records
   - `payments` - Payment transactions

2. Set up Row Level Security (RLS) policies for data protection

3. Generate TypeScript types from your database schema:
   ```bash
   npx supabase gen types typescript --project-id your-project-id --schema public > src/types/supabase.ts
   ```

## Next Steps

1. Create Supabase project and set up database tables
2. Implement authentication routes
3. Add room management endpoints
4. Create booking system API
5. Add payment integration

See `src/controllers/README.md` and `src/services/README.md` for implementation guidance.
