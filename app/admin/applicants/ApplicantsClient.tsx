'use client';

import { deleteAllVolunteerApplicants } from '@/app/actions/admin';
import { exportToExcel } from '@/lib/excel';
import { Button } from '@/components/ui/Button';

export default function ApplicantsClient({ applicants }: { applicants: any[] }) {
  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete ALL applicant requests? This cannot be undone.')) {
      await deleteAllVolunteerApplicants();
    }
  };

  const handleExport = () => {
    const exportData = applicants.map(a => ({
      'ID': a.id,
      'Name': a.name,
      'Faculty': a.faculty,
      'Phone': a.phone,
      'Email': a.email,
      'Applied At': new Date(a.createdAt).toLocaleString()
    }));
    exportToExcel(exportData, 'volunteer_applicants');
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h1 className="text-2xl font-bold">Volunteer Applicants</h1>
        <div className="flex gap-2">
          {applicants.length > 0 && (
            <Button variant="danger" onClick={handleDeleteAll}>Delete All Requests</Button>
          )}
          <Button variant="secondary" onClick={handleExport}>Export to Excel</Button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Faculty</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">No applicants found.</td>
                </tr>
              ) : (
                applicants.map((a) => (
                  <tr key={a.id}>
                    <td className="font-bold">{a.name}</td>
                    <td>{a.faculty}</td>
                    <td>{a.phone}</td>
                    <td>{a.email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
