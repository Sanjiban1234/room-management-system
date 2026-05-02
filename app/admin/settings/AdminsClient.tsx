'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { upsertAdmin, deleteAdmin } from '@/app/actions/admin';

export default function AdminsClient({ admins }: { admins: any[] }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    await upsertAdmin({
      id: editingAdmin?.id,
      username,
      password: password || undefined
    });

    setShowAddForm(false);
    setEditingAdmin(null);
  };

  return (
    <div className="flex-col gap-6" style={{ marginTop: '3rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
        <h2 className="text-xl font-bold">Admin Accounts</h2>
        <Button onClick={() => {
          setEditingAdmin(null);
          setShowAddForm(!showAddForm);
        }}>
          {showAddForm ? 'Cancel' : 'Add Admin'}
        </Button>
      </div>

      {(showAddForm || editingAdmin) && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 className="text-lg font-bold" style={{ marginBottom: '1rem' }}>
            {editingAdmin ? `Edit Admin: ${editingAdmin.username}` : 'Add New Admin'}
          </h3>
          <form onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="flex gap-4">
              <Input 
                label="Username" 
                name="username" 
                defaultValue={editingAdmin?.username || ''} 
                required 
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => {
                setShowAddForm(false);
                setEditingAdmin(null);
              }}>Cancel</Button>
              <Button type="submit">Save Account</Button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="font-bold">{admin.username}</td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setEditingAdmin(admin)}>Edit</Button>
                      <Button variant="danger" onClick={() => {
                        if (confirm(`Are you sure you want to delete admin "${admin.username}"?`)) {
                          deleteAdmin(admin.id).catch(err => alert(err.message));
                        }
                      }}>Delete</Button>
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
