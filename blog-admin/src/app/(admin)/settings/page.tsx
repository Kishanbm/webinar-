'use client';

import { useEffect, useState } from 'react';
import { User, Plus, Trash2 } from 'lucide-react';

type Author = {
  id: string;
  name: string;
  email: string;
};

export default function SettingsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = () => {
    setLoading(true);
    fetch('/api/authors')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Fetch complete fields (needs schema fields, since GET by default returned just id and name, let's allow it)
          // Wait, the API GET route returns { id, name }. That is enough to list them.
          setAuthors(data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleAddAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();

      if (data.success) {
        setName('');
        setEmail('');
        fetchAuthors();
      } else {
        setError(data.error || 'Failed to add author');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAuthor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this author? Any posts linked to this author might fail to render if they do not have an author.')) return;

    try {
      const res = await fetch(`/api/authors?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAuthors(authors.filter((a) => a.id !== id));
      } else {
        alert(data.error || 'Failed to delete author');
      }
    } catch (err) {
      alert('An error occurred while deleting the author.');
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Author List */}
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Manage Authors</h2>
          
          <div className="table-container" style={{ padding: '0px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>Loading authors...</div>
            ) : authors.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>No authors registered.</div>
            ) : (
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((author) => (
                    <tr key={author.id}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                          {author.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{author.name}</span>
                      </td>
                      <td style={{ textAlign: 'right', border: 'none' }}>
                        <button
                          onClick={() => handleDeleteAuthor(author.id)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', color: '#ef4444', borderColor: '#fecaca' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Add Author Form */}
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Add New Author</h2>
          
          <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
            <form onSubmit={handleAddAuthor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Kishan B M"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. kishan@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              >
                <Plus size={18} /> {saving ? 'Adding...' : 'Add Author'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
