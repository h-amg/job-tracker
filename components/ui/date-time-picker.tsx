"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromDate?: Date
  toDate?: Date
  showTime?: boolean
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  disabled = false,
  className,
  fromDate,
  toDate,
  showTime = true,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)
  const [selectedTime, setSelectedTime] = React.useState<{ hour: string; minute: string }>({
    hour: value ? value.getHours().toString().padStart(2, '0') : '09',
    minute: value ? value.getMinutes().toString().padStart(2, '0') : '00'
  })
  
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))
  
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value)
      setSelectedTime({
        hour: value.getHours().toString().padStart(2, '0'),
        minute: value.getMinutes().toString().padStart(2, '0')
      })
    }
  }, [value])
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && onChange) {
      const newDate = new Date(date)
      newDate.setHours(parseInt(selectedTime.hour), parseInt(selectedTime.minute), 0, 0)
      onChange(newDate)
    }
  }
  
  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedTime({ hour, minute })
    if (selectedDate && onChange) {
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hour), parseInt(minute), 0, 0)
      onChange(newDate)
    }
  }
  
  const formatDateTime = (date: Date) => {
    if (showTime) {
      return format(date, "PPP 'at' p")
    }
    return format(date, "PPP")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDateTime(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (disabled) return true
              if (fromDate && date < fromDate) return true
              if (toDate && date > toDate) return true
              return false
            }}
            initialFocus
          />
          {showTime && (
            <div className="border-l p-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Time
                </div>
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedTime.hour}
                    onValueChange={(hour) => handleTimeChange(hour, selectedTime.minute)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">:</span>
                  <Select
                    value={selectedTime.minute}
                    onValueChange={(minute) => handleTimeChange(selectedTime.hour, minute)}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
