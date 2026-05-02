import { db } from '@/lib/firebase';
import VolunteersClient from './VolunteersClient';

export const dynamic = 'force-dynamic';

export default async function VolunteersPage() {
  const snapshot = await db.collection('volunteers').orderBy('name', 'asc').get();
  const volunteers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

  return <VolunteersClient initialVolunteers={volunteers} />;
}
