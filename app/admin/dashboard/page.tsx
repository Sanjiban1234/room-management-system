import { db } from '@/lib/firebase';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const bookingsSnapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(5).get();
  
  // Fetch all volunteers for manual join
  const volunteersSnapshot = await db.collection('volunteers').get();
  const volunteersMap = new Map();
  volunteersSnapshot.docs.forEach((doc: any) => {
    volunteersMap.set(doc.id, { id: doc.id, ...doc.data() });
  });

  const recentBookings: any = bookingsSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      volunteer: data.volunteerId ? volunteersMap.get(data.volunteerId) : null
    };
  });

  const totalBookingsSnapshot = await db.collection('bookings').count().get();
  const totalBookings = totalBookingsSnapshot.data().count;

  const totalVolunteersSnapshot = await db.collection('volunteers').count().get();
  const totalVolunteers = totalVolunteersSnapshot.data().count;

  const totalVolunteerAppsSnapshot = await db.collection('volunteerApplicants').count().get();
  const totalVolunteerApps = totalVolunteerAppsSnapshot.data().count;

  const totalPerformancesSnapshot = await db.collection('performanceRegistrations').count().get();
  const totalPerformances = totalPerformancesSnapshot.data().count;

  return (
    <div className="flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="flex gap-4" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <h3 className="text-muted text-sm">Total Bookings</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--primary-color)', marginTop: '0.5rem' }}>{totalBookings}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <h3 className="text-muted text-sm">Total Volunteers</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-color)', marginTop: '0.5rem' }}>{totalVolunteers}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <h3 className="text-muted text-sm">Volunteer Applicants</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--success-color)', marginTop: '0.5rem' }}>{totalVolunteerApps}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1 }}>
          <h3 className="text-muted text-sm">Performance Registrations</h3>
          <p className="text-2xl font-bold" style={{ color: 'var(--primary-color)', marginTop: '0.5rem' }}>{totalPerformances}</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
          <h2 className="text-xl font-bold">Recent Bookings (Last 5)</h2>
          <Link href="/admin/bookings" style={{ fontSize: '0.85rem' }}>View All →</Link>
        </div>
        
        {recentBookings.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem 0' }}>No bookings found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Faculty</th>
                  <th>Date</th>
                  <th>Assigned Volunteer</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking: any) => (
                  <tr key={booking.id}>
                    <td className="font-bold">{booking.clientName}</td>
                    <td>{booking.faculty}</td>
                    <td>{booking.date}</td>
                    <td>{booking.volunteer ? booking.volunteer.name : 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
