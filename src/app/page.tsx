'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TaskModal } from '@/components/tasks/TaskModal'
import { KanbanView } from '@/components/tasks/KanbanView'
import { CalendarView } from '@/components/tasks/CalendarView'
import { AdvancedFilter } from '@/components/tasks/AdvancedFilter'
import { AIPanel } from '@/components/ai/AIPanel'
import { 
  Plus, 
  Search, 
  Calendar, 
  CheckSquare, 
  Users, 
  BarChart3, 
  Settings, 
  Bell,
  Filter,
  MoreVertical,
  Clock,
  Star,
  Tag,
  Paperclip,
  MessageSquare,
  Timer,
  Target,
  TrendingUp,
  Archive,
  Trash2,
  Edit,
  Play,
  Pause,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  startDate?: string
  completedAt?: string
  estimatedTime?: number
  actualTime?: number
  tags?: string[]
  project?: {
    id: string
    name: string
    color?: string
    icon?: string
  }
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdBy?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
  children?: Task[]
  _count?: {
    comments: number
    attachments: number
    children: number
  }
}

interface Project {
  id: string
  name: string
  color?: string
  icon?: string
  taskCount: number
  completedCount: number
  taskStats?: {
    total: number
    todo: number
    in_progress: number
    completed: number
    cancelled: number
  }
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface FilterState {
  search: string
  status: string[]
  priority: string[]
  projectIds: string[]
  assigneeIds: string[]
  tags: string[]
  dueDateRange: {
    from?: Date
    to?: Date
  }
  estimatedTimeRange: {
    min?: number
    max?: number
  }
  hasAttachments?: boolean
  hasComments?: boolean
  isOverdue?: boolean
  isDueToday?: boolean
  isDueThisWeek?: boolean
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users] = useState<User[]>([
    { id: 'u1', name: 'John Doe', email: 'john@example.com' },
    { id: 'u2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'u3', name: 'Bob Johnson', email: 'bob@example.com' }
  ])
  const [selectedView, setSelectedView] = useState<'list' | 'kanban' | 'calendar' | 'ai'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    search: '',
    status: [],
    priority: [],
    projectIds: [],
    assigneeIds: [],
    tags: [],
    dueDateRange: {},
    estimatedTimeRange: {},
    hasAttachments: undefined,
    hasComments: undefined,
    isOverdue: undefined,
    isDueToday: undefined,
    isDueThisWeek: undefined
  })

  // Fetch data on component mount
  useEffect(() => {
    fetchTasks()
    fetchProjects()
  }, [selectedProject, selectedFilter, searchQuery])

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedProject !== 'all') params.append('projectId', selectedProject)
      if (selectedFilter !== 'all') params.append('status', selectedFilter)
      if (searchQuery) params.append('search', searchQuery)
      
      const response = await fetch(`/api/tasks?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    setIsLoading(true)
    try {
      if (editingTask) {
        // Update existing task
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        })
        if (response.ok) {
          await fetchTasks()
        }
      } else {
        // Create new task
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        })
        if (response.ok) {
          await fetchTasks()
        }
      }
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsLoading(false)
      setEditingTask(null)
    }
  }

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'todo' : 'completed'
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          completedAt: completedAt
        })
      })
      
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowNewTaskModal(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleApplyAdvancedFilters = (filters: FilterState) => {
    setAdvancedFilters(filters)
    // Update simple filters for backward compatibility
    if (filters.status.length === 1) {
      setSelectedFilter(filters.status[0])
    } else {
      setSelectedFilter('all')
    }
    setSearchQuery(filters.search)
    if (filters.projectIds.length === 1) {
      setSelectedProject(filters.projectIds[0])
    } else {
      setSelectedProject('all')
    }
  }

  const handleAITaskCreated = async (taskData: any) => {
    // Create the task directly from AI suggestion
    await handleSaveTask(taskData)
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    urgent: 'bg-red-100 text-red-700 border-red-200'
  }

  const statusColors = {
    todo: 'bg-gray-50 border-gray-200',
    in_progress: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    cancelled: 'bg-red-50 border-red-200'
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={cn(
      'hover:shadow-md transition-all duration-200 cursor-pointer border-l-4',
      statusColors[task.status],
      task.priority === 'urgent' && 'border-l-red-500',
      task.priority === 'high' && 'border-l-orange-500',
      task.priority === 'medium' && 'border-l-blue-500',
      task.priority === 'low' && 'border-l-gray-500'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => toggleTaskStatus(task.id, task.status)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <CardTitle className={cn(
                'text-sm font-medium',
                task.status === 'completed' && 'line-through text-gray-500'
              )}>
                {task.title}
              </CardTitle>
            </div>
            {task.description && (
              <CardDescription className="text-xs mt-1 ml-6">
                {task.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => handleEditTask(task)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => handleDeleteTask(task.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-6">
            <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
              {task.priority}
            </Badge>
            {task.dueDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </div>
            )}
            {task.estimatedTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {task.estimatedTime}m
              </div>
            )}
            {task._count?.comments && task._count.comments > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="h-3 w-3" />
                {task._count.comments}
              </div>
            )}
            {task._count?.attachments && task._count.attachments > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Paperclip className="h-3 w-3" />
                {task._count.attachments}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.project && (
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
            )}
            {task.assignee && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-2 ml-6">
            {task.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">TaskMaster Pro</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <CheckSquare className="w-4 h-4" />
              My Tasks
              <Badge variant="secondary" className="ml-auto">
                {tasks.filter(t => t.status !== 'completed').length}
              </Badge>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <Users className="w-4 h-4" />
              Team
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <Timer className="w-4 h-4" />
              Focus Timer
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
              onClick={() => setSelectedView('ai')}
            >
              <Sparkles className="w-4 h-4" />
              AI Assistant
              <Badge variant="secondary" className="ml-auto">
                New
              </Badge>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-gray-100"
            >
              <Target className="w-4 h-4" />
              Habits
            </Button>
          </div>
          
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Projects
            </h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-left hover:bg-gray-100"
                onClick={() => setSelectedProject('all')}
              >
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                All Projects
              </Button>
              {projects.map(project => (
                <Button
                  key={project.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-left hover:bg-gray-100"
                  onClick={() => setSelectedProject(project.id)}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-left">{project.name}</span>
                  <span className="text-xs text-gray-500">
                    {project.taskStats?.completed || 0}/{project.taskStats?.total || 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-left hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowAdvancedFilter(true)}
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filter
                  {Object.values(advancedFilters).filter(v => 
                    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ''
                  ).length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {Object.values(advancedFilters).filter(v => 
                        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== ''
                      ).length}
                    </Badge>
                  )}
                </Button>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.jpg" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={selectedView === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('list')}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                List
              </Button>
              <Button
                variant={selectedView === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('kanban')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={selectedView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('calendar')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Calendar
              </Button>
            </div>
            
            <Button
              onClick={() => {
                setEditingTask(null)
                setShowNewTaskModal(true)
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedProject === 'all' ? 'All Tasks' : projects.find(p => p.id === selectedProject)?.name}
              </h2>
              <p className="text-gray-600">
                {tasks.filter(t => t.status !== 'completed').length} active tasks • 
                {tasks.filter(t => t.status === 'completed').length} completed
              </p>
            </div>
            
            {/* Render different views */}
            {selectedView === 'list' && (
              <div className="space-y-4">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
            
            {selectedView === 'kanban' && (
              <KanbanView
                tasks={tasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleTaskStatus={toggleTaskStatus}
              />
            )}
            
            {selectedView === 'calendar' && (
              <CalendarView
                tasks={tasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onToggleTaskStatus={toggleTaskStatus}
              />
            )}
            
            {selectedView === 'ai' && (
              <div className="max-w-4xl">
                <AIPanel
                  onTaskCreated={handleAITaskCreated}
                  onInsightApplied={(insight) => {
                    console.log('Applied insight:', insight)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showNewTaskModal}
        onClose={() => {
          setShowNewTaskModal(false)
          setEditingTask(null)
        }}
        task={editingTask}
        projects={projects}
        users={users}
        onSave={handleSaveTask}
        isLoading={isLoading}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilter
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApplyFilters={handleApplyAdvancedFilters}
        currentFilters={advancedFilters}
        projects={projects}
        users={users}
        availableTags={[]} // This would come from your tags API
      />
    </div>
  )
}