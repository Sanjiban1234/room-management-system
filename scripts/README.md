# Admin Scripts

This directory contains utility scripts for managing the application.

## Reset Admin Credentials

**Script:** `reset-admin.js`

### Usage

```bash
npm run reset-admin
```

### What it does

1. Deletes all existing admin accounts from the Firebase database
2. Creates a new super admin account with default credentials

### Default Super Admin Credentials

- **Username:** `mediahead@gmail.com`
- **Password:** `admin123`
- **Role:** Super Admin (Full Access)

### Super Admin Privileges

The super admin account (`mediahead@gmail.com`) has full access including:
- ✅ Create new admin accounts
- ✅ Delete admin accounts
- ✅ Edit any admin account
- ✅ All regular admin features (manage volunteers, bookings, performances, settings)

Regular admins can only edit their own accounts and cannot create/delete other admins.

### Security Notes

⚠️ **IMPORTANT:** 
- Change the default password immediately after logging in
- Keep super admin credentials secure
- Create separate regular admin accounts for team members
- Never commit actual credentials to version control

### Requirements

- Node.js installed
- `.env` file with Firebase configuration:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_SERVICE_ACCOUNT_KEY` (base64 encoded)
- `dotenv` package (automatically installed with dev dependencies)
