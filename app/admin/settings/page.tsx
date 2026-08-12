import { db } from '@/lib/firebase';
import SettingsClient from './SettingsClient';
import AdminsClient from './AdminsClient';
import { getAdmins, getTimeSlots } from '@/app/actions/admin';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settingsSnapshot = await db.collection('systemSettings').where('key', 'in', ['callForVolunteers', 'volunteerCallTopic', 'volunteerCallMessage', 'callForPerformance', 'performanceRegistrationClosedMessage', 'performanceCoordinators']).get();
  const settings = settingsSnapshot.docs.map((doc: any) => doc.data());
  
  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value;

  const isEnabled = getSetting('callForVolunteers') === 'true';
  const isPerformanceEnabled = getSetting('callForPerformance') === 'true';
  const topic = getSetting('volunteerCallTopic') || 'Volunteer Registration';
  const message = getSetting('volunteerCallMessage') || 'We are looking for passionate individuals to join our team. Apply below.';
  const performanceClosedMessage = getSetting('performanceRegistrationClosedMessage') || 'Performance registration is currently closed.';
  const coordinatorsRaw = getSetting('performanceCoordinators') || '{}';
  let coordinators = {};
  try {
    coordinators = JSON.parse(coordinatorsRaw);
  } catch {
    coordinators = {};
  }

  const admins = await getAdmins();
  const timeSlots = await getTimeSlots();
  const session = await getSession() as any;
  const currentAdminId = (session?.adminId as string) || '';
  const currentAdminUsername = (session?.username as string) || '';

  return (
    <div className="flex-col gap-12">
      <div className="flex-col gap-6">
        <h1 className="text-2xl font-bold" style={{ marginBottom: '1rem' }}>System Settings</h1>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <SettingsClient 
            initialEnabled={isEnabled} 
            initialPerformanceEnabled={isPerformanceEnabled}
            initialTopic={topic} 
            initialMessage={message}
            initialPerformanceClosedMessage={performanceClosedMessage}
            initialTimeSlots={timeSlots}
            initialCoordinators={coordinators}
          />
        </div>
      </div>

      <div className="flex-col gap-6" style={{ marginTop: '2rem' }}>
        <h1 className="text-2xl font-bold" style={{ marginBottom: '1rem' }}>Admin Management</h1>
        <AdminsClient 
          admins={admins} 
          currentAdminId={currentAdminId} 
          currentAdminUsername={currentAdminUsername} 
        />
      </div>
    </div>
  );
}
