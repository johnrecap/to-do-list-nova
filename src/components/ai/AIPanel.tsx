'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Plus, 
  Clock, 
  Target, 
  TrendingUp, 
  Brain,
  Lightbulb,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AISuggestion {
  id: string
  type: 'task_suggestion' | 'productivity_insight' | 'time_optimization' | 'deadline_alert'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  actionable: boolean
  data?: any
  timestamp: string
}

interface AIPanelProps {
  onTaskCreated?: (taskData: any) => void
  onInsightApplied?: (insight: any) => void
}

export function AIPanel({ onTaskCreated, onInsightApplied }: AIPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState<any>(null)

  useEffect(() => {
    fetchAISuggestions()
    fetchDailySummary()
  }, [])

  const fetchAISuggestions = async () => {
    setIsLoading(true)
    try {
      // Fetch task suggestions
      const taskResponse = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task_suggestions',
          data: {
            userContext: {
              currentTasks: [],
              recentCompleted: [],
              workPatterns: {}
            },
            projectContext: {
              projects: [],
              upcomingDeadlines: []
            }
          }
        })
      })

      if (taskResponse.ok) {
        const taskData = await taskResponse.json()
        const taskSuggestions = taskData.suggestions.map((suggestion: any, index: number) => ({
          id: `task-${index}`,
          type: 'task_suggestion' as const,
          title: suggestion.title,
          description: suggestion.description,
          priority: suggestion.priority,
          actionable: true,
          data: suggestion,
          timestamp: new Date().toISOString()
        }))
        
        setSuggestions(prev => [...prev, ...taskSuggestions])
      }

      // Fetch productivity insights
      const insightsResponse = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'productivity_insights',
          data: {
            tasksCompleted: [],
            timeSpent: 0,
            taskPatterns: {},
            completionRates: {},
            productivityByTimeOfDay: {},
            productivityByDayOfWeek: {}
          }
        })
      })

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        const insightSuggestions = insightsData.insights.map((insight: any, index: number) => ({
          id: `insight-${index}`,
          type: insight.type === 'warning' ? 'deadline_alert' : 'productivity_insight',
          title: insight.title,
          description: insight.description,
          priority: insight.type === 'warning' ? 'high' : 'medium',
          actionable: insight.actionable,
          data: insight,
          timestamp: new Date().toISOString()
        }))
        
        setSuggestions(prev => [...prev, ...insightSuggestions])
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDailySummary = async () => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'daily_summary',
          data: {
            tasksCompleted: [],
            tasksInProgress: [],
            tasksCreated: [],
            timeSpent: 0,
            productivityScore: 85,
            upcomingDeadlines: []
          }
        })
      })

      if (response.ok) {
        const summary = await response.json()
        setDailySummary(summary)
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error)
    }
  }

  const handleCreateTaskFromSuggestion = (suggestion: AISuggestion) => {
    if (suggestion.data && onTaskCreated) {
      const taskData = {
        title: suggestion.data.title,
        description: suggestion.data.description,
        priority: suggestion.data.priority,
        estimatedTime: suggestion.data.estimatedTime,
        tags: suggestion.data.tags
      }
      onTaskCreated(taskData)
      
      // Remove the suggestion after creating the task
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    }
  }

  const handleApplyInsight = (suggestion: AISuggestion) => {
    if (onInsightApplied) {
      onInsightApplied(suggestion.data)
      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'task_suggestion':
        return <Lightbulb className="w-4 h-4" />
      case 'productivity_insight':
        return <TrendingUp className="w-4 h-4" />
      case 'time_optimization':
        return <Clock className="w-4 h-4" />
      case 'deadline_alert':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Brain className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Daily Summary */}
      {dailySummary && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Daily Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-blue-700 mb-2">{dailySummary.summary}</p>
            {dailySummary.motivationalMessage && (
              <p className="text-blue-600 italic">"{dailySummary.motivationalMessage}"</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          AI Suggestions
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAISuggestions}
          disabled={isLoading}
        >
          <Brain className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.length === 0 && !isLoading && (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <Brain className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">No AI suggestions available right now</p>
              <p className="text-sm text-gray-500 mt-1">
                Start working on tasks to get personalized recommendations
              </p>
            </CardContent>
          </Card>
        )}

        {suggestions.map(suggestion => (
          <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getSuggestionIcon(suggestion.type)}
                  <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', getPriorityColor(suggestion.priority))}>
                    {suggestion.priority}
                  </Badge>
                  {suggestion.actionable && (
                    <Badge variant="secondary" className="text-xs">
                      Actionable
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                {suggestion.description}
              </CardDescription>
              
              {suggestion.actionable && (
                <div className="flex gap-2">
                  {suggestion.type === 'task_suggestion' && (
                    <Button
                      size="sm"
                      onClick={() => handleCreateTaskFromSuggestion(suggestion)}
                      className="gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Create Task
                    </Button>
                  )}
                  {suggestion.type === 'productivity_insight' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyInsight(suggestion)}
                      className="gap-1"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Apply
                    </Button>
                  )}
                  {suggestion.type === 'deadline_alert' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyInsight(suggestion)}
                      className="gap-1"
                    >
                      <Target className="w-3 h-3" />
                      Review
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {isLoading && (
          <Card className="border-gray-200">
            <CardContent className="p-6 text-center">
              <Brain className="w-8 h-8 mx-auto text-gray-400 mb-2 animate-pulse" />
              <p className="text-gray-600">AI is analyzing your data...</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            Quick AI Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              // This would open a smart task creation dialog
              console.log('Smart task creation')
            }}
          >
            <Lightbulb className="w-4 h-4" />
            Smart Task Creation
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              // This would optimize the user's schedule
              console.log('Schedule optimization')
            }}
          >
            <Clock className="w-4 h-4" />
            Optimize Schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              // This would provide productivity tips
              console.log('Productivity tips')
            }}
          >
            <TrendingUp className="w-4 h-4" />
            Productivity Tips
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}