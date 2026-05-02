# Music Club Slot Booking System

A systematic room allocation and slot booking application for the Music Club, built with Next.js and Firebase.

## Features
- **Public Slot Reservation**: Book time slots with available volunteers.
- **Volunteer Applications**: Interested individuals can apply to join.
- **Admin Portal**: Manage bookings, volunteers, blocked dates, and system settings.
- **Secure Backend**: Uses Firebase Admin SDK and Server Actions for all database operations.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS 4, Lucide React.
- **Backend**: Next.js Server Actions, Firebase Firestore.
- **Auth**: Custom JWT-based session management.

## Prerequisites
- Node.js 20+
- Firebase Project with Firestore enabled.
- A Firebase Service Account JSON key.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env` and fill in your credentials.
   ```bash
   cp .env.example .env
   ```
   *Note: For `FIREBASE_SERVICE_ACCOUNT_KEY`, you must Base64-encode your entire Service Account JSON file.*

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the App**:
   - Public Site: [http://localhost:3000](http://localhost:3000)
   - Admin Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Security
- **Firestore Rules**: Public access is disabled (`if false`). All data access is routed through Server Actions using the Admin SDK.
- **Route Protection**: Admin routes are protected by `middleware.ts`.
- **Environment Secrets**: Sensitive keys are stored in `.env` and excluded from git via `.gitignore`.

## Deployment
This project is ready to be deployed on **Vercel**. 
Ensure you add all variables from `.env` to your Vercel Project Settings.
