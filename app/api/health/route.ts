import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return NextResponse.json({
      status: 'ok',
      message: 'API is running',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'API is running but database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    }, { status: 500 })
  }
}