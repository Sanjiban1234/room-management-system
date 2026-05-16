'use server';

import bcrypt from 'bcrypt';
import { db } from '@/lib/firebase';
import { setSession, clearSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const username = (formData.get('username') as string)?.toLowerCase();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  const querySnapshot = await db.collection('admins').where('username', '==', username).limit(1).get();

  if (querySnapshot.empty) {
    return { error: 'Invalid credentials' };
  }

  const adminDoc = querySnapshot.docs[0];
  const admin = adminDoc.data();

  const passwordMatch = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordMatch) {
    return { error: 'Invalid credentials' };
  }

  await setSession(adminDoc.id);
  // Using direct redirect in server action
  redirect('/admin/dashboard');
}

export async function logoutAction() {
  await clearSession();
  redirect('/admin/login');
}
