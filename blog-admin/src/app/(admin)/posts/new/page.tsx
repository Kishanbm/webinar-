'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { ssr: false });

export default function NewPost() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [authors, setAuthors] = useState<{id: string, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    seoTitle: '',
    seoDescription: '',
    content: '',
    status: 'DRAFT',
    authorId: '',
    excerpt: '',
    coverImage: '',
    categoryName: '',
    tagNames: ''
  });

  // Fetch authors for the dropdown
  useEffect(() => {
    fetch('/api/authors')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setAuthors(data.data);
          setFormData(prev => ({ ...prev, authorId: data.data[0].id }));
        }
      });
  }, []);

  const uploadCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, coverImage: data.publicUrl }));
    } catch (error) {
      alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Auto-generate slug if empty
    let submitData = { ...formData };
    if (!submitData.slug) {
      submitData.slug = submitData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        alert(data.error || 'Failed to create post');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1>Create New Post</h1>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          
          {/* Main Content Area */}
          <div>
            <div className="form-group">
              <label className="form-label">Post Title</label>
              <input 
                type="text" 
                className="form-input" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Enter an engaging title..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Content</label>
              <TipTapEditor 
                content={formData.content}
                onChange={(html) => setFormData({...formData, content: html})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Excerpt (Short Summary)</label>
              <textarea 
                className="form-input" 
                rows={3}
                value={formData.excerpt}
                onChange={e => setFormData({...formData, excerpt: e.target.value})}
                placeholder="A short summary of the article..."
              ></textarea>
            </div>
          </div>

          {/* Sidebar Settings */}
          <div>
            <div className="form-group">
              <label className="form-label">Publish Status</label>
              <select 
                className="form-input"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Author</label>
              {authors.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#ef4444' }}>No authors found. Run test script first!</div>
              ) : (
                <select 
                  className="form-input"
                  value={formData.authorId}
                  onChange={e => setFormData({...formData, authorId: e.target.value})}
                  required
                >
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}
            </div>

            <hr style={{ borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Organization</h3>

            <div className="form-group">
              <label className="form-label">Featured Image (Cover)</label>
              {formData.coverImage && (
                <div style={{ marginBottom: '8px' }}>
                  <img src={formData.coverImage} alt="Cover" style={{ width: '100%', borderRadius: '8px' }} />
                </div>
              )}
              <input type="file" accept="image/*" onChange={uploadCoverImage} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.categoryName}
                onChange={e => setFormData({...formData, categoryName: e.target.value})}
                placeholder="e.g. Options Trading"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.tagNames}
                onChange={e => setFormData({...formData, tagNames: e.target.value})}
                placeholder="e.g. Iron Condor, SPX"
              />
            </div>

            <hr style={{ borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />
            
            <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>SEO Settings</h3>
            <div className="form-group">
              <label className="form-label">URL Slug (leave empty to auto-generate)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value})}
                placeholder="my-awesome-post"
              />
            </div>

            <div className="form-group">
              <label className="form-label">SEO Title</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.seoTitle}
                onChange={e => setFormData({...formData, seoTitle: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Meta Description</label>
              <textarea 
                className="form-input" 
                rows={4}
                value={formData.seoDescription}
                onChange={e => setFormData({...formData, seoDescription: e.target.value})}
              ></textarea>
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Post'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
