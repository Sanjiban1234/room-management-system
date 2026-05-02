import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
