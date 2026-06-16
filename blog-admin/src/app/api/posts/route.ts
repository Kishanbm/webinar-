import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all posts (with filtering support)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const authorId = searchParams.get('authorId');

    const posts = await prisma.post.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(authorId ? { authorId } : {}),
      },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        category: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST create a new post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.slug || !body.content || !body.authorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (title, slug, content, authorId)' },
        { status: 400 }
      );
    }

    let categoryData = undefined;
    if (body.categoryName && body.categoryName.trim() !== '') {
      const catName = body.categoryName.trim();
      categoryData = {
        connectOrCreate: {
          where: { name: catName },
          create: { name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
        }
      };
    }

    let tagsData = undefined;
    if (body.tagNames && body.tagNames.trim() !== '') {
      const tagsArray = body.tagNames.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '');
      if (tagsArray.length > 0) {
        tagsData = {
          connectOrCreate: tagsArray.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName, slug: tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }
          }))
        };
      }
    }

    const post = await prisma.post.create({
      data: {
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt,
        coverImage: body.coverImage,
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        status: body.status || 'DRAFT',
        authorId: body.authorId,
        category: categoryData,
        tags: tagsData,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      },
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create post:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
