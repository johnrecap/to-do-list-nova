import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Create sample user
  const user = await db.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    }
  })

  // Create sample projects
  const project1 = await db.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete website overhaul',
      color: '#3b82f6',
      icon: '🎨',
      ownerId: user.id,
    }
  })

  const project2 = await db.project.create({
    data: {
      name: 'Platform Development',
      description: 'Build the core platform',
      color: '#10b981',
      icon: '⚙️',
      ownerId: user.id,
    }
  })

  // Create sample tasks
  await db.task.createMany({
    data: [
      {
        title: 'Design new dashboard layout',
        description: 'Create wireframes and mockups for new analytics dashboard',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedTime: 120,
        projectId: project1.id,
        createdById: user.id,
        tags: JSON.stringify(['design', 'ui/ux'])
      },
      {
        title: 'Implement authentication system',
        description: 'Add OAuth and email authentication',
        status: 'todo',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedTime: 180,
        projectId: project2.id,
        createdById: user.id,
        tags: JSON.stringify(['backend', 'security'])
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints',
        status: 'completed',
        priority: 'medium',
        completedAt: new Date(),
        estimatedTime: 60,
        projectId: project2.id,
        createdById: user.id,
        tags: JSON.stringify(['documentation'])
      }
    ]
  })

  console.log('✅ Sample data created successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error creating sample data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })