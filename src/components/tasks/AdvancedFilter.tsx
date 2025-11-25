'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { CalendarIcon, Filter, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

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

interface AdvancedFilterProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: FilterState) => void
  currentFilters: FilterState
  projects: Array<{ id: string; name: string; color?: string }>
  users: Array<{ id: string; name: string; email: string }>
  availableTags: string[]
}

export function AdvancedFilter({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters,
  projects,
  users,
  availableTags
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters)
  const [newTag, setNewTag] = useState('')

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleMultiSelectChange = (key: keyof FilterState, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: checked 
        ? [...(prev[key] as string[]), value]
        : (prev[key] as string[]).filter(item => item !== value)
    }))
  }

  const handleAddTag = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleClearFilters = () => {
    setFilters({
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
  }

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.projectIds.length > 0) count++
    if (filters.assigneeIds.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.dueDateRange.from || filters.dueDateRange.to) count++
    if (filters.estimatedTimeRange.min !== undefined || filters.estimatedTimeRange.max !== undefined) count++
    if (filters.hasAttachments !== undefined) count++
    if (filters.hasComments !== undefined) count++
    if (filters.isOverdue !== undefined) count++
    if (filters.isDueToday !== undefined) count++
    if (filters.isDueThisWeek !== undefined) count++
    return count
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">{getActiveFiltersCount()} active</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Refine your task view with advanced filtering options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search in title, description, notes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {['todo', 'in_progress', 'completed', 'cancelled'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status.includes(status)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange('status', status, checked as boolean)
                    }
                  />
                  <Label htmlFor={`status-${status}`} className="capitalize">
                    {status.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="grid grid-cols-2 gap-2">
              {['low', 'medium', 'high', 'urgent'].map(priority => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priority.includes(priority)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange('priority', priority, checked as boolean)
                    }
                  />
                  <Label htmlFor={`priority-${priority}`} className="capitalize">
                    {priority}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <Label>Projects</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {projects.map(project => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={filters.projectIds.includes(project.id)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange('projectIds', project.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`project-${project.id}`} className="flex items-center gap-2">
                    {project.color && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    {project.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users.map(user => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`user-${user.id}`}
                    checked={filters.assigneeIds.includes(user.id)}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange('assigneeIds', user.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
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

          {/* Due Date Range */}
          <div className="space-y-2">
            <Label>Due Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="due-from" className="text-sm">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dueDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dueDateRange.from ? format(filters.dueDateRange.from, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dueDateRange.from}
                      onSelect={(date) => handleFilterChange('dueDateRange', { 
                        ...filters.dueDateRange, 
                        from: date 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="due-to" className="text-sm">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dueDateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dueDateRange.to ? format(filters.dueDateRange.to, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dueDateRange.to}
                      onSelect={(date) => handleFilterChange('dueDateRange', { 
                        ...filters.dueDateRange, 
                        to: date 
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Estimated Time Range */}
          <div className="space-y-2">
            <Label>Estimated Time Range (minutes)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-min" className="text-sm">Min</Label>
                <Input
                  id="time-min"
                  type="number"
                  placeholder="0"
                  value={filters.estimatedTimeRange.min || ''}
                  onChange={(e) => handleFilterChange('estimatedTimeRange', { 
                    ...filters.estimatedTimeRange, 
                    min: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
              <div>
                <Label htmlFor="time-max" className="text-sm">Max</Label>
                <Input
                  id="time-max"
                  type="number"
                  placeholder="999"
                  value={filters.estimatedTimeRange.max || ''}
                  onChange={(e) => handleFilterChange('estimatedTimeRange', { 
                    ...filters.estimatedTimeRange, 
                    max: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <Label>Quick Filters</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overdue"
                  checked={filters.isOverdue}
                  onCheckedChange={(checked) => 
                    handleFilterChange('isOverdue', checked)
                  }
                />
                <Label htmlFor="overdue">Overdue</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="due-today"
                  checked={filters.isDueToday}
                  onCheckedChange={(checked) => 
                    handleFilterChange('isDueToday', checked)
                  }
                />
                <Label htmlFor="due-today">Due Today</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="due-week"
                  checked={filters.isDueThisWeek}
                  onCheckedChange={(checked) => 
                    handleFilterChange('isDueThisWeek', checked)
                  }
                />
                <Label htmlFor="due-week">Due This Week</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-attachments"
                  checked={filters.hasAttachments}
                  onCheckedChange={(checked) => 
                    handleFilterChange('hasAttachments', checked)
                  }
                />
                <Label htmlFor="has-attachments">Has Attachments</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-comments"
                  checked={filters.hasComments}
                  onCheckedChange={(checked) => 
                    handleFilterChange('hasComments', checked)
                  }
                />
                <Label htmlFor="has-comments">Has Comments</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}