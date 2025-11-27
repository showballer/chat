import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, role, content, sqlQuery, queryResult, status, errorMessage } = body;

    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        sqlQuery,
        queryResult,
        status,
        errorMessage,
      },
    });

    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
