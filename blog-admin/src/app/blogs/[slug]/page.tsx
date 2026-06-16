import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const revalidate = 60;

// Dynamically generate SEO tags for this specific post
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  
  if (!post) {
    return { title: 'Post Not Found | Navigation Trading' };
  }

  return {
    title: `${post.seoTitle || post.title} | Navigation Trading`,
    description: post.seoDescription || post.title,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.title,
      type: 'article',
      publishedTime: post.createdAt.toISOString(),
    }
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: true, category: true, tags: true }
  });

  if (!post) {
    notFound();
  }

  // Ensure it's published or we return 404
  if (post.status !== 'PUBLISHED') {
    notFound();
  }

  return (
    <div className="blog-page-container">
      <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '24px' }}>
        <a href="/blogs" style={{ color: 'var(--orange)', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
          &larr; Back to all posts
        </a>
      </div>
      
      <article className="blog-content">
        <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-light)', paddingBottom: '32px' }}>
          {post.category && (
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--emerald-600)', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {post.category.name}
            </div>
          )}
          <h1 className="blog-title" style={{ fontSize: '48px' }}>{post.title}</h1>
          <div className="blog-meta" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--teal-900)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {post.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{post.author.name}</div>
                <div>{new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
            </div>
          </div>
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
              {post.tags.map(tag => (
                <span key={tag.id} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', color: 'var(--text-dim)' }}>
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Render TipTap Raw HTML securely */}
        <div 
          className="blog-body"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />
      </article>
    </div>
  );
}
