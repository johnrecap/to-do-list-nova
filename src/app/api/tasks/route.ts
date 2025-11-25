import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const search = searchParams.get('search')
    const assigneeId = searchParams.get('assigneeId')
    const tags = searchParams.get('tags')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    
    if (projectId && projectId !== 'all') {
      where.projectId = projectId
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority
    }
    
    if (assigneeId) {
      where.assigneeId = assigneeId
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (tags) {
      const tagArray = tags.split(',')
      where.tags = {
        hasSome: tagArray
      }
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        children: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        dependencies: {
          include: {
            dependsOnTask: {
              select: {
                id: true,
                title: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            children: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    })

    const total = await db.task.count({ where })

    return NextResponse.json({
      tasks,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      notes,
      priority = 'medium',
      dueDate,
      startDate,
      estimatedTime,
      projectId,
      assigneeId,
      parentId,
      tags,
      customFields,
      isRecurring,
      recurringRule,
      location
    } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from authentication
    const createdById = 'demo-user-id'

    const task = await db.task.create({
      data: {
        title,
        description,
        notes,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        projectId,
        assigneeId,
        parentId,
        createdById,
        tags: tags ? JSON.stringify(tags) : null,
        customFields: customFields ? JSON.stringify(customFields) : null,
        isRecurring: isRecurring || false,
        recurringRule,
        location
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    // Create reminders if due date is set
    if (dueDate) {
      await db.reminder.create({
        data: {
          taskId: task.id,
          type: 'notification',
          triggerAt: new Date(new Date(dueDate).getTime() - 24 * 60 * 60 * 1000), // 1 day before
          message: `Task "${title}" is due tomorrow`
        }
      })
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}