import type { NextConfig } from "next";

const securityHeaders = [
  // 🛡️ Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // 🛡️ Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // 🛡️ Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // 🛡️ Disable access to sensitive browser APIs
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // 🛡️ Force HTTPS (1 year, include subdomains)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // 🛡️ Content Security Policy — restrict resource origins
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",   // unsafe-inline needed for Next.js inline scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",              // Equivalent to X-Frame-Options: DENY
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "jose", "firebase-admin"],
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
