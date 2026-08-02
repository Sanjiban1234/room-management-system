import Link from 'next/link';
import Image from 'next/image';
import BookingForm from '@/components/client/BookingForm';
import ApplicationForm from '@/components/client/ApplicationForm';
import BookingLookup from '@/components/client/BookingLookup';
import { getBlockedDatesSimple } from '@/app/actions/admin';
import { getPublicHomeSettings, getPublicVolunteers, getTimeSlots } from '@/app/actions/client';

// Cache the public page at Vercel's edge and regenerate it at most every five
// minutes. Admin mutations already call revalidatePath('/'), so content changes
// are reflected immediately without making every visitor wait for Firestore.
export const revalidate = 300;

export default async function Home() {
  // These public, independent reads start together. Bookings are deliberately
  // excluded: the client requests only the selected date when it is needed.
  const [volunteers, blockedDates, timeSlots, settings] = await Promise.all([
    getPublicVolunteers(),
    getBlockedDatesSimple(),
    getTimeSlots(),
    getPublicHomeSettings(),
  ]);

  const isCallForVolunteers = settings.callForVolunteers === 'true';
  const isCallForPerformance = settings.callForPerformance === 'true';
  const volunteerTopic = settings.volunteerCallTopic || 'Volunteer Registration';
  const volunteerMessage = settings.volunteerCallMessage || 'We are looking for passionate individuals to join our team. Apply below.';

  return (
    <div className="container animate-fade-in" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>


      <main className="flex-col gap-12" style={{ flex: 1, paddingBottom: '4rem' }}>

        {/* Hero Section with Club Image */}
        <div className="flex-col lg:flex-row hero-container" style={{ minHeight: '400px', marginBottom: '2rem', position: 'relative' }}>
          
          <div className="hero-image-wrapper" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '250px' }}>
            <Image
              src="/hero-image.jpg"
              alt="Music Club"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div style={{ flex: 1, padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
            <h1 className="text-4xl font-bold" style={{ marginBottom: '1rem', lineHeight: '1.1' }}>Welcome to our <span style={{ color: 'var(--primary-color)' }}>Music Club website</span></h1>
            <p className="text-lg text-muted" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
              Systematic room allotment for everyone
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
