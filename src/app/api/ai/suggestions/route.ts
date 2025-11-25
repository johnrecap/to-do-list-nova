import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    const zai = await ZAI.create()

    switch (type) {
      case 'task_suggestions':
        return await getTaskSuggestions(zai, data)
      case 'smart_categorization':
        return await smartCategorization(zai, data)
      case 'productivity_insights':
        return await getProductivityInsights(zai, data)
      case 'time_estimation':
        return await getTimeEstimation(zai, data)
      case 'daily_summary':
        return await getDailySummary(zai, data)
      default:
        return NextResponse.json(
          { error: 'Invalid AI suggestion type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in AI suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}

async function getTaskSuggestions(zai: any, data: any) {
  const { userContext, projectContext } = data

  const prompt = `Based on the following user context and project information, suggest 5 relevant tasks that the user should consider adding:

User Context:
- Current tasks: ${JSON.stringify(userContext.currentTasks || [], null, 2)}
- Recent completed tasks: ${JSON.stringify(userContext.recentCompleted || [], null, 2)}
- Work patterns: ${JSON.stringify(userContext.workPatterns || {}, null, 2)}

Project Context:
- Active projects: ${JSON.stringify(projectContext.projects || [], null, 2)}
- Upcoming deadlines: ${JSON.stringify(projectContext.upcomingDeadlines || [], null, 2)}

Please suggest tasks that are:
1. Relevant to their current work
2. Consider their work patterns and productivity
3. Help them meet upcoming deadlines
4. Break down larger projects into manageable tasks
5. Consider task dependencies

Return the response as a JSON array with objects containing:
- title: string
- description: string
- priority: "low" | "medium" | "high" | "urgent"
- estimatedTime: number (in minutes)
- suggestedProject: string (project ID or null)
- reasoning: string (why this task is suggested)
- tags: string[]`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a productivity assistant that suggests relevant tasks based on user context and project information. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  })

  const suggestions = JSON.parse(completion.choices[0].message.content)
  
  return NextResponse.json({ suggestions })
}

async function smartCategorization(zai: any, data: any) {
  const { taskTitle, taskDescription, existingProjects, existingTags } = data

  const prompt = `Analyze this task and suggest the best project and tags:

Task: ${taskTitle}
Description: ${taskDescription || 'No description provided'}

Existing Projects:
${existingProjects.map((p: any) => `- ${p.name} (${p.id})`).join('\n')}

Existing Tags:
${existingTags.join(', ')}

Please suggest:
1. The most appropriate project (or "new" if none fit well)
2. 3-5 relevant tags (can include existing ones or suggest new ones)
3. A priority level based on the task content
4. An estimated time to complete

Return as JSON:
{
  "suggestedProject": "project_id_or_new",
  "suggestedProjectName": "New project name if project is 'new'",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedPriority": "low|medium|high|urgent",
  "estimatedTime": 45,
  "reasoning": "Brief explanation of suggestions"
}`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a task categorization assistant. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3
  })

  const categorization = JSON.parse(completion.choices[0].message.content)
  
  return NextResponse.json(categorization)
}

async function getProductivityInsights(zai: any, data: any) {
  const { 
    tasksCompleted, 
    timeSpent, 
    taskPatterns, 
    completionRates, 
    productivityByTimeOfDay,
    productivityByDayOfWeek 
  } = data

  const prompt = `Analyze this productivity data and provide actionable insights:

Data:
- Tasks completed: ${JSON.stringify(tasksCompleted, null, 2)}
- Time spent: ${JSON.stringify(timeSpent, null, 2)}
- Task patterns: ${JSON.stringify(taskPatterns, null, 2)}
- Completion rates: ${JSON.stringify(completionRates, null, 2)}
- Productivity by time of day: ${JSON.stringify(productivityByTimeOfDay, null, 2)}
- Productivity by day of week: ${JSON.stringify(productivityByDayOfWeek, null, 2)}

Provide insights on:
1. Most productive time periods
2. Task completion patterns
3. Areas for improvement
4. Suggestions for better time management
5. Potential burnout risks
6. Recommendations for task scheduling

Return as JSON:
{
  "insights": [
    {
      "type": "productivity_pattern|recommendation|warning",
      "title": "Brief title",
      "description": "Detailed explanation",
      "actionable": true/false,
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "productivityScore": 85,
  "peakProductivityTimes": ["morning", "afternoon"],
  "recommendations": ["recommendation1", "recommendation2"]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a productivity analyst. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.4
  })

  const insights = JSON.parse(completion.choices[0].message.content)
  
  return NextResponse.json(insights)
}

async function getTimeEstimation(zai: any, data: any) {
  const { taskTitle, taskDescription, taskType, complexity, userHistoricalData } = data

  const prompt = `Estimate the time needed to complete this task:

Task: ${taskTitle}
Description: ${taskDescription || 'No description'}
Type: ${taskType}
Complexity: ${complexity}

User's historical data for similar tasks:
${JSON.stringify(userHistoricalData, null, 2)}

Consider:
- User's past performance on similar tasks
- Task complexity and scope
- Typical time requirements for this type of work
- User's work patterns and speed

Return as JSON:
{
  "estimatedTime": 120,
  "confidence": 0.8,
  "timeRange": {
    "min": 90,
    "max": 150
  },
  "factors": ["factor1", "factor2"],
  "comparableTasks": [
    {
      "task": "Similar task name",
      "actualTime": 115,
      "similarity": 0.85
    }
  ],
  "recommendations": ["Break into smaller subtasks", "Start with research phase"]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a time estimation expert. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.2
  })

  const estimation = JSON.parse(completion.choices[0].message.content)
  
  return NextResponse.json(estimation)
}

async function getDailySummary(zai: any, data: any) {
  const { 
    tasksCompleted, 
    tasksInProgress, 
    tasksCreated, 
    timeSpent, 
    productivityScore,
    upcomingDeadlines 
  } = data

  const prompt = `Create a daily productivity summary:

Today's data:
- Tasks completed: ${JSON.stringify(tasksCompleted, null, 2)}
- Tasks in progress: ${JSON.stringify(tasksInProgress, null, 2)}
- Tasks created: ${JSON.stringify(tasksCreated, null, 2)}
- Time spent: ${timeSpent} minutes
- Productivity score: ${productivityScore}
- Upcoming deadlines: ${JSON.stringify(upcomingDeadlines, null, 2)}

Generate a friendly, motivational summary that includes:
1. Accomplishments celebration
2. Progress acknowledgment
3. Tomorrow's priorities
4. Motivational message
5. Any concerns about upcoming deadlines

Return as JSON:
{
  "summary": "Overall summary text",
  "highlights": ["highlight1", "highlight2"],
  "accomplishments": ["accomplishment1", "accomplishment2"],
  "tomorrowPriorities": ["priority1", "priority2"],
  "motivationalMessage": "Motivational quote or message",
  "productivityRating": "excellent|good|moderate|needs_improvement",
  "deadlineAlerts": ["alert1", "alert2"]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a friendly productivity coach. Always respond with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.6
  })

  const summary = JSON.parse(completion.choices[0].message.content)
  
  return NextResponse.json(summary)
}