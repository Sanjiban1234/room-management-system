import Link from 'next/link';
import BookingForm from '@/components/client/BookingForm';
import ApplicationForm from '@/components/client/ApplicationForm';
import BookingLookup from '@/components/client/BookingLookup';
import { getBlockedDatesSimple } from '@/app/actions/admin';
import { getBookings, getPublicVolunteers, getTimeSlots } from '@/app/actions/client';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const volunteers = await getPublicVolunteers();
  const bookings = await getBookings();
  const blockedDates = await getBlockedDatesSimple();
  const timeSlots = await getTimeSlots();

  // Fetch settings manually
  const settingsSnapshot = await db.collection('systemSettings').where('key', 'in', ['callForVolunteers', 'volunteerCallTopic', 'volunteerCallMessage', 'callForPerformance']).get();
  const settingsList = settingsSnapshot.docs.map((doc: any) => doc.data());

  const getSetting = (key: string) => settingsList.find((s: any) => s.key === key)?.value;
  const isCallForVolunteers = getSetting('callForVolunteers') === 'true';
  const isCallForPerformance = getSetting('callForPerformance') === 'true';
  const volunteerTopic = getSetting('volunteerCallTopic') || 'Volunteer Registration';
  const volunteerMessage = getSetting('volunteerCallMessage') || 'We are looking for passionate individuals to join our team. Apply below.';

  return (
    <div className="container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>


      <main className="flex-col gap-12" style={{ flex: 1, paddingBottom: '4rem' }}>

        {/* Hero Section with Club Image */}
        <div className="flex-col lg:flex-row hero-container" style={{ minHeight: '400px', marginBottom: '2rem', position: 'relative' }}>
          
          <div className="hero-image-wrapper" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <img
              src="/hero-image.jpg"
              alt="Music Club"
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '250px' }}
            />
          </div>

          <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
            <h1 className="text-4xl font-bold" style={{ marginBottom: '1rem', lineHeight: '1.1' }}>Welcome to our <span style={{ color: 'var(--primary-color)' }}>Music Club website</span></h1>
            <p className="text-lg text-muted" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
              Systematic room allocement for everyone
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="#booking" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto' }}>Book Now</a>
              {isCallForVolunteers && <a href="#join-us" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto' }}>{volunteerTopic}</a>}
              {isCallForPerformance && <Link href="/performance-registration" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto', background: 'var(--accent-color)' }}>Register for Performance</Link>}
              <a href="#my-booking" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', flex: '1 1 auto' }}>My Booking</a>
            </div>
          </div>
        </div>

        <div className="flex-col lg:flex-row gap-8 items-start justify-center">

          {/* Booking Section */}
          <div id="booking" className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '600px' }}>
            <div className="text-center" style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '1.5rem', display: 'inline-block', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary-color)', marginBottom: '1rem' }}>📅</div>
              <h2 className="text-2xl font-bold" style={{ marginBottom: '0.5rem' }}>Reserve Your Slot</h2>
              <p className="text-muted">Select your preferred date and available volunteer to reserve your slot.</p>
            </div>
            <BookingForm
              volunteers={volunteers}
              initialBookings={bookings}
              blockedDates={blockedDates}
              timeSlots={timeSlots}
            />
          </div>

          {/* Volunteer Application Section - Conditional */}
          {isCallForVolunteers && (
            <div id="join-us" className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '600px' }}>
              <div className="text-center" style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '1.5rem', display: 'inline-block', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(46, 204, 113, 0.1)', color: 'var(--success-color)', marginBottom: '1rem' }}>🤝</div>
                <h2 className="text-2xl font-bold" style={{ marginBottom: '0.5rem' }}>{volunteerTopic}</h2>
                <p className="text-muted">{volunteerMessage}</p>
              </div>
              <ApplicationForm />
            </div>
          )}

        </div>

        {/* Booking Lookup Section */}
        <div id="my-booking" className="flex justify-center" style={{ marginTop: '2rem' }}>
          <BookingLookup />
        </div>

      </main>

      <footer className="text-center text-muted" style={{ padding: '2rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        <p>&copy; 2026 MEC . All rights reserved.</p>
      </footer>
    </div>
  );
}
