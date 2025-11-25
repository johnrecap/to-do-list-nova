import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArchived = searchParams.get('includeArchived') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (!includeArchived) {
      where.isArchived = false
    }

    const projects = await db.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: {
              where: {
                isArchived: false
              }
            },
            members: true
          }
        }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    // Add task counts by status for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await db.task.groupBy({
          by: ['status'],
          where: {
            projectId: project.id,
            isArchived: false
          },
          _count: {
            status: true
          }
        })

        const stats = taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status
          return acc
        }, {} as Record<string, number>)

        return {
          ...project,
          taskStats: {
            total: project._count.tasks,
            todo: stats.todo || 0,
            in_progress: stats.in_progress || 0,
            completed: stats.completed || 0,
            cancelled: stats.cancelled || 0
          }
        }
      })
    )

    const total = await db.project.count({ where })

    return NextResponse.json({
      projects: projectsWithStats,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      color,
      icon,
      isPublic = false,
      parentId
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from authentication
    const ownerId = 'demo-user-id'

    // Get the highest sort order for proper positioning
    const maxSortOrder = await db.project.aggregate({
      where: { ownerId },
      _max: { sortOrder: true }
    })

    const project = await db.project.create({
      data: {
        name,
        description,
        color,
        icon,
        isPublic,
        parentId,
        ownerId,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        _count: {
          select: {
            tasks: {
              where: {
                isArchived: false
              }
            },
            members: true
          }
        }
      }
    })

    // Add the creator as an owner member
    await db.projectMember.create({
      data: {
        projectId: project.id,
        userId: ownerId,
        role: 'owner'
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}