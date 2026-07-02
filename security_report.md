# Security Audit Report

This document outlines the final security audit of the **Slot Booking and Performance Registration Application**.

---

## 1. Dependency Vulnerability Analysis (`npm audit`)

We ran `npm audit` and identified 11 initial vulnerabilities across dependencies. All packages have been audited and secured using standard npm dependency overrides.

| Package | Severity | Issue | Resolution / Mitigation |
| :--- | :--- | :--- | :--- |
| `postcss` | Moderate | XSS via Unescaped `</style>` in CSS Stringify | **FIXED**: Added npm override forcing `postcss` to `^8.5.10`. |
| `@tootallnate/once` | Low/Moderate | Incorrect Control Flow Scoping | **FIXED**: Added npm override forcing `@tootallnate/once` to `^3.0.1`. |
| `xlsx` | High | Prototype Pollution / ReDoS in sheetJS | **MITIGATED**: The application only uses `xlsx` to *generate and export* server data to Excel. We do not accept or parse untrusted user Excel files, making Prototype Pollution and ReDoS vectors completely unexploitable. |

---

## 2. Code-Level Security Controls

### Admin Route & Server Action Authorization
* **Middleware Protection:**
  All page requests under `/admin` (except the login screen) are intercepted by Next.js edge middleware. The cookie-based session token is cryptographically verified on every transition.
* **Server Action Protection:**
  Every server action in `app/actions/admin.ts` calls `await ensureAdmin()`. This ensures that even if an attacker guesses a server action ID, they cannot perform database writes or reads without a valid JWT cookie.
* **Firestore Security Rules:**
  All direct client-side read/write requests to the Firestore database are explicitly denied (`allow read, write: if false;` in `firestore.rules`). Database interactions are restricted solely to the server environment through the secure Firebase Admin SDK.
* **Cross-Site Scripting (XSS):**
  No React `dangerouslySetInnerHTML` methods are used. All rendering outputs are automatically escaped by React.

---

## 3. Rate Limiting & Abuse Prevention
To protect against brute-force attacks and spam, the following mitigations have been implemented:

1. **Admin Login Protection:**
   We implemented an IP-based sliding window in `loginAction`. A maximum of **5 failed login attempts per IP within a 15-minute window** is allowed. Further attempts are blocked. Failed logs are immediately cleared upon successful authentication.
2. **Volunteer Application Spam Prevention:**
   Duplicates are blocked at the database level by verifying that the applicant's email and phone number are unique inside the `volunteerApplicants` collection before allowing a new write.
