'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { upsertAdmin, deleteAdmin } from '@/app/actions/admin';

export default function AdminsClient({ 
  admins, 
  currentAdminId, 
  currentAdminUsername 
}: { 
  admins: any[]; 
  currentAdminId: string; 
  currentAdminUsername: string; 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = currentAdminUsername === 'mediahead@gmail.com';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username.toLowerCase().endsWith('@gmail.com')) {
      setError('Username must be a valid Gmail address (ending in @gmail.com)');
      setLoading(false);
      return;
    }

    try {
      await upsertAdmin({
        id: editingAdmin?.id,
        name,
        username,
        password: password || undefined
      });
      setShowAddForm(false);
      setEditingAdmin(null);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-6" style={{ marginTop: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h2 className="text-xl font-bold">Admin Accounts</h2>
        {isSuperAdmin && (
          <Button onClick={() => {
            setEditingAdmin(null);
            setShowAddForm(!showAddForm);
          }}>
            {showAddForm ? 'Cancel' : 'Add Admin'}
          </Button>
        )}
      </div>

      {(showAddForm || editingAdmin) && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>
            {editingAdmin ? `Edit Admin: ${editingAdmin.name || editingAdmin.username}` : 'Add New Admin'}
          </h3>
          
          {error && (
            <div style={{ padding: '0.75rem', marginBottom: '1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 71, 87, 0.1)', color: 'var(--error-color)', border: '1px solid rgba(255, 71, 87, 0.3)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="flex flex-col gap-4">
              <Input 
                label="Full Name" 
                name="name" 
                defaultValue={editingAdmin?.name || ''} 
                required 
                placeholder="Enter admin's full name"
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                  label="Username (Gmail)" 
                  name="username" 
                  type="email"
                  defaultValue={editingAdmin?.username || ''} 
                  required 
                  placeholder="example@gmail.com"
                  style={{ flex: 1 }} 
                />
                <Input 
                  label={editingAdmin ? "New Password (Optional)" : "Password"} 
                  name="password" 
                  type="password" 
                  required={!editingAdmin} 
                  style={{ flex: 1 }} 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => {
                setShowAddForm(false);
                setEditingAdmin(null);
                setError(null);
              }}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Account'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Admin Details</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="font-bold">
                    <div>{admin.name || <span className="text-muted italic" style={{ fontWeight: 'normal' }}>No Name</span>}</div>
                    <div className="text-xs text-muted font-normal">{admin.username}</div>
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      {(isSuperAdmin || admin.id === currentAdminId) && (
                        <Button variant="secondary" onClick={() => setEditingAdmin(admin)}>Edit</Button>
                      )}
                      {isSuperAdmin && admin.username !== 'mediahead@gmail.com' && (
                        <Button variant="danger" onClick={() => {
                          if (confirm(`Are you sure you want to delete admin "${admin.username}"?`)) {
                            deleteAdmin(admin.id)
                              .then(() => window.location.reload())
                              .catch(err => alert(err.message));
                          }
                        }}>Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
