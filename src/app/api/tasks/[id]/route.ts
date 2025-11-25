import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await db.task.findUnique({
      where: { id: params.id },
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        attachments: true,
        timeEntries: {
          orderBy: { startTime: 'desc' }
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
        reminders: true,
        focusSessions: {
          orderBy: { startTime: 'desc' }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      notes,
      status,
      priority,
      dueDate,
      startDate,
      completedAt,
      estimatedTime,
      actualTime,
      projectId,
      assigneeId,
      tags,
      customFields,
      isRecurring,
      recurringRule,
      location,
      isArchived
    } = body

    const task = await db.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        notes,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
        actualTime: actualTime ? parseInt(actualTime) : null,
        projectId,
        assigneeId,
        tags: tags ? JSON.stringify(tags) : null,
        customFields: customFields ? JSON.stringify(customFields) : null,
        isRecurring,
        recurringRule,
        location,
        isArchived
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}