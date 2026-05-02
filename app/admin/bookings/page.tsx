import { db } from '@/lib/firebase';
import BookingsClient from './BookingsClient';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const bookingsSnapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
  
  // Fetch all volunteers for manual join
  const volunteersSnapshot = await db.collection('volunteers').get();
  const volunteersMap = new Map();
  volunteersSnapshot.docs.forEach((doc: any) => {
    volunteersMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  const bookings = bookingsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      volunteer: data.volunteerId ? volunteersMap.get(data.volunteerId) : null
    };
  });

  return <BookingsClient initialBookings={bookings} />;
}
