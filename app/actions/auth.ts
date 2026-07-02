'use server';

import bcrypt from 'bcrypt';
import { db } from '@/lib/firebase';
import { setSession, clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { headers } from 'next/headers';
import { getClientIp, checkRateLimit } from '@/lib/rate-limiter';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.toLowerCase();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  const ip = await getClientIp();

  // Enforce global rate limit (10 total login attempts per 15 minutes per IP)
  const globalRateLimit = await checkRateLimit('login_attempts', ip, 10, 15 * 60 * 1000);
  if (!globalRateLimit.allowed) {
    return { error: 'Too many login attempts. Please try again after 15 minutes.' };
  }

  // Check rate limit: max 5 failed attempts within 15 minutes
  const failedAttemptsQuery = await db.collection('failedLoginAttempts')
    .where('ip', '==', ip)
    .get();

  const timeWindowMs = Date.now() - 15 * 60 * 1000;
  const recentFailedAttempts = failedAttemptsQuery.docs.filter((doc: any) => {
    const timestamp = doc.data().timestamp;
    return new Date(timestamp).getTime() >= timeWindowMs;
  });

  if (recentFailedAttempts.length >= 5) {
    return { error: 'Too many failed login attempts. Please try again after 15 minutes.' };
  }

  const querySnapshot = await db.collection('admins').where('username', '==', username).limit(1).get();

  if (querySnapshot.empty) {
    await db.collection('failedLoginAttempts').doc().set({
      username,
      ip,
      timestamp: new Date().toISOString()
    });
    return { error: 'Invalid credentials' };
  }

  const adminDoc = querySnapshot.docs[0];
  const admin = adminDoc.data();

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordMatch) {
    await db.collection('failedLoginAttempts').doc().set({
      username,
      ip,
      timestamp: new Date().toISOString()
    });
    return { error: 'Invalid credentials' };
  }

  // Clear failed login attempts on successful login
  if (!failedAttemptsQuery.empty) {
    const batch = db.batch();
    failedAttemptsQuery.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  await setSession(adminDoc.id, admin.name || '', admin.username);
  // Using direct redirect in server action
  redirect('/admin/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/admin/login');
}
