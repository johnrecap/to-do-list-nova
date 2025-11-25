'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { CalendarIcon, X, Plus, Clock, Flag, Tag, Paperclip, User, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  startDate?: Date
  estimatedTime?: number
  tags?: string[]
  projectId?: string
  assigneeId?: string
  notes?: string
  location?: string
  isRecurring?: boolean
  recurringRule?: string
}

interface Project {
  id: string
  name: string
  color?: string
  icon?: string
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  projects: Project[]
  users: User[]
  onSave: (task: Partial<Task>) => Promise<void>
  isLoading?: boolean
}

export function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  projects, 
  users, 
  onSave, 
  isLoading = false 
}: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    tags: [],
    estimatedTime: undefined,
    notes: '',
    location: '',
    isRecurring: false
  })
  const [newTag, setNewTag] = useState('')
  const [isAISuggesting, setIsAISuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
        tags: task.tags || []
      })
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        tags: [],
        estimatedTime: undefined,
        notes: '',
        location: '',
        isRecurring: false
      })
    }
  }, [task, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleAICategorization = async () => {
    if (!formData.title) return

    setIsAISuggesting(true)
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'smart_categorization',
          data: {
            taskTitle: formData.title,
            taskDescription: formData.description,
            existingProjects: projects,
            existingTags: []
          }
        })
      })

      if (response.ok) {
        const suggestions = await response.json()
        setAiSuggestions(suggestions)
        
        // Apply AI suggestions
        setFormData(prev => ({
          ...prev,
          priority: suggestions.suggestedPriority || prev.priority,
          estimatedTime: suggestions.estimatedTime || prev.estimatedTime,
          projectId: suggestions.suggestedProject === 'new' ? undefined : suggestions.suggestedProject,
          tags: suggestions.suggestedTags || prev.tags
        }))
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
    } finally {
      setIsAISuggesting(false)
    }
  }

  const handleTimeEstimation = async () => {
    if (!formData.title) return

    setIsAISuggesting(true)
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'time_estimation',
          data: {
            taskTitle: formData.title,
            taskDescription: formData.description,
            taskType: 'general',
            complexity: formData.priority,
            userHistoricalData: {}
          }
        })
      })

      if (response.ok) {
        const estimation = await response.json()
        setFormData(prev => ({
          ...prev,
          estimatedTime: estimation.estimatedTime
        }))
      }
    } catch (error) {
      console.error('Error getting time estimation:', error)
    } finally {
      setIsAISuggesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.trim()) return

    await onSave(formData)
    onClose()
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task ? 'Edit Task' : 'Create New Task'}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAICategorization}
              disabled={isAISuggesting || !formData.title}
              className="ml-auto"
            >
              <Sparkles className={cn("w-4 h-4", isAISuggesting && "animate-spin")} />
              AI Suggest
            </Button>
          </DialogTitle>
          <DialogDescription>
            {task ? 'Edit the details of your task.' : 'Add a new task to your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="What needs to be done?"
              className="text-base"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority || 'medium'}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-gray-500" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-orange-500" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status || 'todo'}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={formData.projectId || ''}
                onValueChange={(value) => handleInputChange('projectId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        {project.color && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                        )}
                        {project.icon && <span>{project.icon}</span>}
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={formData.assigneeId || ''}
                onValueChange={(value) => handleInputChange('assigneeId', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleInputChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => handleInputChange('dueDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleTimeEstimation}
                disabled={isAISuggesting || !formData.title}
              >
                <Clock className="w-4 h-4 mr-1" />
                AI Estimate
              </Button>
            </div>
            <Input
              id="estimatedTime"
              type="number"
              value={formData.estimatedTime || ''}
              onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value) || undefined)}
              placeholder="60"
              min="1"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Where should this be done?"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes, links, or information..."
              rows={3}
            />
          </div>

          {/* AI Suggestions Display */}
          {aiSuggestions && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Suggestions Applied
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-blue-700">{aiSuggestions.reasoning}</p>
              </CardContent>
            </Card>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.title?.trim()}>
              {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}