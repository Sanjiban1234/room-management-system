import { getPerformanceRegistrations } from '@/app/actions/admin';
import PerformancesClient from './PerformancesClient';

export const dynamic = 'force-dynamic';

export default async function PerformancesPage() {
  const registrations = await getPerformanceRegistrations();

  return (
    <div className="flex-col gap-6">
      <h1 className="text-2xl font-bold">Performance Registrations</h1>
      <PerformancesClient initialRegistrations={registrations} />
    </div>
  );
}
