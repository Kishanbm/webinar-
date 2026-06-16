import prisma from '@/lib/prisma';
import Link from 'next/link';

export const metadata = {
  title: 'Blog | Navigation Trading',
  description: 'Read the latest strategies, updates, and market insights from Navigation Trading.',
};

export const revalidate = 60; // Revalidate every 60 seconds (Incremental Static Regeneration)

export default async function BlogsPage() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: { author: true, category: true }
  });

  return (
    <div className="blog-page-container">
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <h1 className="blog-title">NavigationTrading Blog</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '18px' }}>Market insights, institutional strategies, and updates.</p>
      </div>

      <div className="blog-grid">
        {posts.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '64px' }}>
            <p>No posts published yet. Check back soon!</p>
          </div>
        ) : (
          posts.map(post => {
            // Automatically extract the first image from post content if coverImage is not explicitly set
            let displayImage = post.coverImage;
            if (!displayImage && post.content) {
              const imgMatch = post.content.match(/<img[^>]+src="([^">]+)"/);
              if (imgMatch) {
                displayImage = imgMatch[1];
              }
            }

            return (
              <a href={`/blogs/${post.slug}`} key={post.id} className="blog-card">
                {displayImage && (
                  <img src={displayImage} alt={post.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                )}
                <div className="blog-card-content">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--emerald-600)', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {post.category ? post.category.name : 'ARTICLE'}
                  </div>
                  <h2 className="blog-card-title">{post.title}</h2>
                  <div className="blog-card-excerpt">
                    {post.excerpt || post.seoDescription || 'Read the full article to learn more...'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="read-more">
                      Read Post &rarr;
                    </div>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
