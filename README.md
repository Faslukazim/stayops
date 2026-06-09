# StayB Hostel Manager

A small hostel management MVP built with React, Vite, Tailwind CSS, and Supabase.

## Setup

```bash
npm install
npm run dev
```

For Supabase persistence, copy `.env.example` to `.env` and set:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Create a `tenants` table with these columns:

| Column | Type |
| --- | --- |
| id | uuid primary key default gen_random_uuid() |
| name | text |
| phone | text |
| roomNumber | text |
| monthlyRent | numeric |
| joinDate | date |
| paymentStatus | text |
| paymentDate | date nullable |
| createdAt | timestamptz default now() |

The app falls back to browser local storage when Supabase keys are not configured.
