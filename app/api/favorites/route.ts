import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const addFavoriteSchema = z.object({
  type: z.enum(['LEGAL_SECTION', 'CASE_LAW', 'FIR_TEMPLATE']),
  itemId: z.string().min(1, 'Item ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    const skip = (page - 1) * limit

    const where: any = {
      userId: user.id,
    }
    
    if (type) {
      where.type = type
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.favorite.count({ where }),
    ])

    // Get detailed information for each favorite
    const detailedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        let item = null
        
        switch (favorite.type) {
          case 'LEGAL_SECTION':
            item = await prisma.legalSection.findUnique({
              where: { id: favorite.itemId },
              select: {
                id: true,
                act: true,
                section: true,
                title: true,
                description: true,
                category: true,
                frequency: true,
              },
            })
            break
          case 'CASE_LAW':
            item = await prisma.caseLaw.findUnique({
              where: { id: favorite.itemId },
              select: {
                id: true,
                title: true,
                citation: true,
                court: true,
                date: true,
                category: true,
                summary: true,
                rating: true,
                relevance: true,
              },
            })
            break
          case 'FIR_TEMPLATE':
            item = await prisma.fIR.findUnique({
              where: { id: favorite.itemId },
              select: {
                id: true,
                firNumber: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                createdAt: true,
              },
            })
            break
        }

        return {
          ...favorite,
          item,
        }
      })
    )

    return NextResponse.json({
      favorites: detailedFavorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get favorites error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = addFavoriteSchema.parse(body)

    // Check if item exists
    let itemExists = false
    
    switch (data.type) {
      case 'LEGAL_SECTION':
        itemExists = !!(await prisma.legalSection.findUnique({
          where: { id: data.itemId },
        }))
        break
      case 'CASE_LAW':
        itemExists = !!(await prisma.caseLaw.findUnique({
          where: { id: data.itemId },
        }))
        break
      case 'FIR_TEMPLATE':
        itemExists = !!(await prisma.fIR.findUnique({
          where: { id: data.itemId },
        }))
        break
    }

    if (!itemExists) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId: user.id,
          type: data.type,
          itemId: data.itemId,
        },
      },
    })

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Item already in favorites' },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        type: data.type,
        itemId: data.itemId,
      },
    })

    return NextResponse.json(favorite, { status: 201 })
  } catch (error) {
    console.error('Add favorite error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const itemId = searchParams.get('itemId')

    if (!type || !itemId) {
      return NextResponse.json(
        { error: 'Type and itemId are required' },
        { status: 400 }
      )
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_type_itemId: {
          userId: user.id,
          type: type as any,
          itemId,
        },
      },
    })

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      )
    }

    await prisma.favorite.delete({
      where: {
        userId_type_itemId: {
          userId: user.id,
          type: type as any,
          itemId,
        },
      },
    })

    return NextResponse.json(
      { message: 'Favorite removed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Remove favorite error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
