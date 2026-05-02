import { db } from '@/lib/firebase';
import ApplicantsClient from './ApplicantsClient';

export const dynamic = 'force-dynamic';

export default async function ApplicantsPage() {
  const snapshot = await db.collection('volunteerApplicants').orderBy('createdAt', 'desc').get();
  const applicants = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

  return <ApplicantsClient applicants={applicants} />;
}
