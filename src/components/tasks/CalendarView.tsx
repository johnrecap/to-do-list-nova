'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical,
  Edit,
  Trash2,
  Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns'

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
}

interface CalendarViewProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onToggleTaskStatus: (taskId: string, currentStatus: string) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200'
}

const statusColors = {
  todo: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-500'
}

export function CalendarView({ tasks, onEditTask, onDeleteTask, onToggleTaskStatus }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const tasksWithDueDates = tasks.filter(task => task.dueDate)

  const getTasksForDate = (date: Date) => {
    return tasksWithDueDates.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    )
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    )
  }

  const renderDaysOfWeek = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd')
        const cloneDay = day
        const dayTasks = getTasksForDate(cloneDay)
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isTodayDate = isToday(day)

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "bg-white border border-gray-200 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors",
              !isCurrentMonth && "bg-gray-50 text-gray-400",
              isSelected && "ring-2 ring-blue-500",
              isTodayDate && "bg-blue-50"
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={cn(
                "text-sm font-medium",
                !isCurrentMonth && "text-gray-400",
                isTodayDate && "text-blue-600 font-bold"
              )}>
                {formattedDate}
              </span>
              {dayTasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {dayTasks.length}
                </Badge>
              )}
            </div>
            
            <div className="space-y-1">
              {dayTasks.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  className="group relative"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditTask(task)
                  }}
                >
                  <div className="flex items-center gap-1 text-xs">
                    <div 
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        statusColors[task.status]
                      )}
                    />
                    <span className="truncate flex-1">{task.title}</span>
                  </div>
                  
                  {/* Hover actions */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-1 bg-white shadow-md rounded p-1 z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditTask(task)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteTask(task.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {dayTasks.length > 3 && (
                <div className="text-xs text-gray-500 pl-3">
                  +{dayTasks.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      
      rows.push(
        <div className="grid grid-cols-7 gap-px bg-gray-200" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    
    return <div className="flex-1">{rows}</div>
  }

  const TaskDetails = ({ date }: { date: Date }) => {
    const dayTasks = getTasksForDate(date)
    
    if (dayTasks.length === 0) return null

    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Tasks for {format(date, 'MMMM d, yyyy')}
            <Badge variant="secondary">{dayTasks.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dayTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      statusColors[task.status]
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={cn('text-xs', priorityColors[task.priority])}>
                        {task.priority}
                      </Badge>
                      {task.estimatedTime && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {task.estimatedTime}m
                        </div>
                      )}
                      {task.project && (
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-xs text-gray-600">{task.project.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {task.assignee && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar} />
                      <AvatarFallback className="text-xs">
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onEditTask(task)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onDeleteTask(task.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderDaysOfWeek()}
        {renderCells()}
      </div>
      {selectedDate && <TaskDetails date={selectedDate} />}
    </div>
  )
}