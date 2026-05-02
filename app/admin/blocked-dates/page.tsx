import { getBlockedDates } from '@/app/actions/admin';
import BlockedDatesClient from '@/app/admin/blocked-dates/BlockedDatesClient';

export const dynamic = 'force-dynamic';

export default async function BlockedDatesPage() {
  const initialBlockedDates = await getBlockedDates();

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <BlockedDatesClient initialBlockedDates={initialBlockedDates} />
    </div>
  );
}
