import { NextRequest, NextResponse } from 'next/server';
import { classifyText } from '@/lib/ml-service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text?.trim()) {
            return NextResponse.json(
                { error: 'Please provide text to classify' },
                { status: 400 }
            );
        }

        const result = await classifyText(text);

        if (!result) {
            return NextResponse.json(
                { error: 'ML service is unavailable. Please ensure the ML service is running.' },
                { status: 503 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Classification error:', error);
        return NextResponse.json(
            { error: 'Failed to classify text' },
            { status: 500 }
        );
    }
}
