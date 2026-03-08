import { NextResponse } from 'next/server';
import { getMLHealth, getModelInfo, getAccuracyMetrics } from '@/lib/ml-service';

export async function GET() {
    try {
        const [health, modelInfo, accuracy] = await Promise.all([
            getMLHealth(),
            getModelInfo(),
            getAccuracyMetrics(),
        ]);

        return NextResponse.json({
            online: !!health?.status,
            health,
            modelInfo,
            accuracy,
        });
    } catch (error) {
        return NextResponse.json({
            online: false,
            error: 'ML service is not available',
        });
    }
}
