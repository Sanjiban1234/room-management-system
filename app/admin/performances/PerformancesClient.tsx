'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { deleteAllPerformanceRegistrations } from '@/app/actions/admin';
import * as XLSX from 'xlsx';

export default function PerformancesClient({ initialRegistrations }: { initialRegistrations: any[] }) {
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = () => {
    const dataToExport = registrations.map(reg => {
      let typeStr = reg.performanceType;
      if (reg.performanceType === 'Other') typeStr += ` (${reg.otherPerformanceType})`;
      
      let groupMembersStr = '';
      if (reg.type === 'Group' && reg.groupMembers) {
        groupMembersStr = reg.groupMembers.map((m: any) => `${m.name} (${m.phone})`).join(', ');
      }

      return {
        Name: reg.name,
        Phone: reg.phone,
        'College Mail': reg.collegeMail,
        'Performance Category': typeStr,
        'Solo/Group': reg.type,
        'Group Members': groupMembersStr,
        'Applied At': new Date(reg.createdAt).toLocaleString(),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Performances');
    XLSX.writeFile(workbook, 'Performance_Registrations.xlsx');
  };

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete ALL performance registrations? This cannot be undone.')) {
      setIsDeleting(true);
      await deleteAllPerformanceRegistrations();
      setRegistrations([]);
      setIsDeleting(false);
    }
  };

  // Prepare data for visual representation
  const typeCounts = registrations.reduce((acc, reg) => {
    const type = reg.performanceType === 'Other' ? reg.otherPerformanceType || 'Other' : reg.performanceType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const soloGroupCounts = registrations.reduce((acc, reg) => {
    acc[reg.type] = (acc[reg.type] || 0) + 1;
    return acc;
  }, { Solo: 0, Group: 0 } as Record<string, number>);

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center bg-panel" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <p>Total Registrations: <strong>{registrations.length}</strong></p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={registrations.length === 0}>Export CSV/Excel</Button>
          <Button variant="danger" onClick={handleDeleteAll} disabled={isDeleting || registrations.length === 0}>
            {isDeleting ? 'Deleting...' : 'Delete All'}
          </Button>
        </div>
      </div>

      {/* Visual Representations */}
      {registrations.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '300px' }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>Performance Types</h3>
            <div className="flex-col gap-2">
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span>{type}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ height: '8px', backgroundColor: 'var(--primary-color)', borderRadius: '4px', width: `${((count as number) / registrations.length) * 100}px`, minWidth: '10px' }} />
                    <span className="font-bold text-sm">{count as number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '300px' }}>
            <h3 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>Solo vs Group</h3>
            <div className="flex-col gap-4">
              <div className="flex justify-between items-center">
                <span>Solo ({soloGroupCounts.Solo})</span>
                <div style={{ height: '20px', backgroundColor: 'var(--accent-color)', borderRadius: '4px', width: `${(soloGroupCounts.Solo / Math.max(registrations.length, 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between items-center">
                <span>Group ({soloGroupCounts.Group})</span>
                <div style={{ height: '20px', backgroundColor: 'var(--success-color)', borderRadius: '4px', width: `${(soloGroupCounts.Group / Math.max(registrations.length, 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '3rem' }}>
          <p className="text-muted">No performance registrations found.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Performance Type</th>
                  <th>Type</th>
                  <th>Members</th>
                  <th>Applied At</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id}>
                    <td className="font-bold">{reg.name}</td>
                    <td>
                      <div>{reg.phone}</div>
                      <div className="text-xs text-muted">{reg.collegeMail}</div>
                    </td>
                    <td>
                      {reg.performanceType}
                      {reg.performanceType === 'Other' && <span className="text-xs text-muted block">{reg.otherPerformanceType}</span>}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: 'var(--radius-sm)', 
                        fontSize: '0.75rem',
                        backgroundColor: reg.type === 'Solo' ? 'rgba(52, 152, 219, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                        color: reg.type === 'Solo' ? 'var(--primary-color)' : 'var(--success-color)'
                      }}>
                        {reg.type}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      {reg.type === 'Group' && reg.groupMembers ? (
                        <div className="text-xs">
                          {reg.groupMembers.map((m: any, i: number) => (
                            <div key={i}>{m.name} ({m.phone})</div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="text-sm">{new Date(reg.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
