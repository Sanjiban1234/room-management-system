'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { importFromExcel } from '@/lib/excel';
import { createVolunteer, deleteVolunteer, importVolunteersBulk } from '@/app/actions/admin';

export default function VolunteersClient({ initialVolunteers }: { initialVolunteers: any[] }) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sortOption, setSortOption] = useState<'name' | 'batch'>('name');

  const filteredVolunteers = initialVolunteers
    .filter(v => v.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return String(a.batch).localeCompare(String(b.batch), undefined, { numeric: true });
      }
    });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromExcel(file);
      // Generalized mapping for batch and other fields
      const mappedVolunteers = data.map(row => {
        const findValue = (keys: string[]) => {
          const key = Object.keys(row).find(k => keys.some(s => k.toLowerCase() === s.toLowerCase()));
          return key ? String(row[key]) : '';
        };

        return {
          name: findValue(['name', 'full name', 'volunteer']),
          faculty: findValue(['faculty', 'department', 'major']),
          batch: findValue(['batch', 'class', 'year', 'level']),
          phone: findValue(['phone', 'mobile', 'contact', 'number'])
        };
      }).filter(v => v.name && v.faculty && v.phone);

      if (mappedVolunteers.length > 0) {
        await importVolunteersBulk(mappedVolunteers);
        alert(`Successfully imported ${mappedVolunteers.length} volunteers.`);
      } else {
        alert('No valid rows found. Ensure the Excel has name, faculty, batch, and phone columns.');
      }
    } catch (err) {
      alert('Error importing Excel file.');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createVolunteer({
      name: formData.get('name') as string,
      faculty: formData.get('faculty') as string,
      batch: formData.get('batch') as string,
      phone: formData.get('phone') as string,
    });
    setShowAddForm(false);
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h1 className="text-2xl font-bold">Manage Volunteers</h1>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleImport} 
            style={{ display: 'none' }} 
            id="excel-upload"
          />
          <Button variant="secondary" onClick={() => document.getElementById('excel-upload')?.click()}>
            Import from Excel
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : 'Add Volunteer'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>Add New Volunteer</h2>
          <form onSubmit={handleAddSubmit} className="flex gap-4 items-center flex-wrap">
            <Input label="Name" name="name" required style={{ minWidth: '200px', flex: 1 }} />
            <div className="input-group" style={{ minWidth: '150px', flex: 1, marginBottom: '0' }}>
              <label>Faculty</label>
              <select name="faculty" className="select" required>
                <option value="">-- Faculty --</option>
                <option value="BEI">BEI</option>
                <option value="BEL">BEL</option>
                <option value="BCT">BCT</option>
                <option value="BCE">BCE</option>
                <option value="BCA">BCA</option>
              </select>
            </div>
            <Input label="Batch" name="batch" required style={{ minWidth: '100px', flex: 1 }} />
            <Input label="Phone" name="phone" required style={{ minWidth: '150px', flex: 1 }} />
            <div style={{ marginTop: '0.4rem' }}>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel flex-col lg:flex-row gap-4" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 2, width: '100%' }}>
          <Input 
            label="Search by Volunteer Name" 
            placeholder="Type name here..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="input-group" style={{ flex: 1, width: '100%', marginBottom: '0' }}>
          <label>Sort By</label>
          <select className="select" value={sortOption} onChange={(e) => setSortOption(e.target.value as 'name' | 'batch')}>
            <option value="name">Name (A-Z)</option>
            <option value="batch">Batch (Ascending)</option>
          </select>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Faculty</th>
                <th>Batch</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">No volunteers found.</td>
                </tr>
              ) : (
                filteredVolunteers.map((v) => (
                  <tr key={v.id}>
                    <td className="font-bold">{v.name}</td>
                    <td>{v.faculty}</td>
                    <td>{v.batch}</td>
                    <td>{v.phone}</td>
                    <td>
                      <Button variant="danger" onClick={() => deleteVolunteer(v.id)}>Delete</Button>
                    </td>
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
