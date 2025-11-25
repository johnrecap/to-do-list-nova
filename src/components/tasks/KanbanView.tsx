'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  MoreVertical, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Tag,
  User,
  Edit,
  Trash2
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
  estimatedTime?: number
  tags?: string[]
  project?: {
    id: string
    name: string
    color?: string
  }
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  _count?: {
    comments: number
    attachments: number
  }
}

interface KanbanViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void
}

const columns = [
  { id: 'todo', title: 'To Do', color: 'border-gray-300' },
  { id: 'in_progress', title: 'In Progress', color: 'border-blue-300' },
  { id: 'completed', title: 'Completed', color: 'border-green-300' },
  { id: 'cancelled', title: 'Cancelled', color: 'border-red-300' }
]

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200'
}

export function KanbanView({ tasks, onEditTask, onDeleteTask, onToggleTaskStatus }: KanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (draggedTask && draggedTask.status !== newStatus) {
      onToggleTaskStatus(draggedTask.id, draggedTask.status)
    }
    setDraggedTask(null)
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => onEditTask(task)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
            {task.priority}
          </Badge>
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
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
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.project.color }}
              />
            )}
            {task.assignee && (
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback className="text-[10px]">
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map(column => {
        const columnTasks = tasks.filter(task => task.status === column.id)
        
        return (
          <div 
            key={column.id}
            className="flex-1 min-w-[300px] max-w-[350px]"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={cn(
              "bg-gray-50 rounded-lg p-4 h-full",
              "border-2 border-dashed",
              column.color
            )}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
              
              <div className="space-y-2 min-h-[200px]">
                {columnTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No tasks in {column.title.toLowerCase()}</div>
                    <div className="text-xs mt-1">Drag tasks here to change status</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}