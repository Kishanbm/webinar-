import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const authors = await prisma.user.findMany({
      select: { id: true, name: true }
    });
    return NextResponse.json({ success: true, data: authors });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch authors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email }
    });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create author' }, { status: 500 });
  }
}
