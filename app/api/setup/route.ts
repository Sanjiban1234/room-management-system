import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/firebase';
import { getClientIp, checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 🛡️ SECURITY: Disable this endpoint in production unless explicitly allowed.
  // Set ALLOW_SETUP=true in your environment ONLY during initial setup, then remove it.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SETUP !== 'true') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  try {
    const ip = await getClientIp();
    const rateLimit = await checkRateLimit('api_setup', ip, 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again after 15 minutes.' }, { status: 429 });
    }

    const adminsSnapshot = await db.collection('admins').limit(1).get();
    
    if (!adminsSnapshot.empty) {
      return NextResponse.json({ message: 'Admin already exists. Setup skipped.' });
    }

    const defaultUsername = 'admin';
    const defaultPassword = 'password';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await db.collection('admins').doc().set({
      username: defaultUsername,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Default admin created successfully! Username: admin, Password: password' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
