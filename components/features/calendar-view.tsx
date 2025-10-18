"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarIcon, 
  ClockIcon, 
  BuildingIcon, 
  BriefcaseIcon
} from "lucide-react";
import { type Application } from "@/lib/data/job-applications-data";

interface CalendarViewProps {
  applications: Application[];
}

interface InterviewEvent {
  application: Application;
  date: Date;
}

export function CalendarView({ applications }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const router = useRouter();

  // Filter applications to only those with Interview status and interviewDate
  const scheduledInterviews = applications.filter(
    (app) => app.status === "Interview" && app.interviewDate
  );

  // Group interviews by date
  const interviewsByDate = scheduledInterviews.reduce((acc, app) => {
    if (!app.interviewDate) return acc;
    
    const dateKey = app.interviewDate.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  // Create interview events for calendar modifiers
  const interviewEvents: InterviewEvent[] = scheduledInterviews.map(app => ({
    application: app,
    date: app.interviewDate!
  }));

  // Calendar modifiers for styling dates with interviews
  const modifiers = {
    hasInterview: interviewEvents.map(event => event.date),
  };

  const modifiersClassNames = {
    hasInterview: "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold",
  };

  // Get interviews for selected date
  const selectedDateInterviews = selectedDate 
    ? interviewsByDate[selectedDate.toDateString()] || []
    : [];


  const handleDateClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleInterviewClick = (applicationId: string) => {
    router.push(`/application/${applicationId}`);
  };

  if (scheduledInterviews.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Interview Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Interviews</h3>
            <p className="text-muted-foreground">
              When you have interviews scheduled, they will appear here on their interview dates.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      {/* Calendar */}
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Interview Calendar
            <Badge variant="secondary" className="ml-2">
              {scheduledInterviews.length} scheduled
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            components={{}}
            className="w-full"
            classNames={{
              // Make the calendar consume available width
              months: "flex flex-col w-full space-y-6",
              month: "space-y-6 w-full",
              // Keep caption relative so absolute-positioned nav buttons align
              caption: "relative flex items-center justify-center py-2",
              caption_label: "text-base font-semibold",
              nav: "flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md",
              nav_button_previous: "absolute left-2",
              nav_button_next: "absolute right-2",
              // Use a true 7-column grid so cells expand with width
              table: "w-full",
              head_row: "grid grid-cols-7 gap-2",
              head_cell: "text-center text-muted-foreground font-normal text-xs md:text-sm",
              row: "grid grid-cols-7 gap-2 mt-2",
              // Make each cell square and allow the day button to fill it
              cell: "relative p-0 aspect-square",
              day: "h-full w-full p-0 font-medium aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center text-sm md:text-base",
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Interviews */}
      {selectedDate && selectedDateInterviews.length > 0 && (
        <Card className="w-full mt-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Interviews on {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDateInterviews.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-6 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer hover:shadow-md"
                  onClick={() => handleInterviewClick(app.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <BuildingIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{app.company}</h4>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <BriefcaseIcon className="h-4 w-4" />
                        {app.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium">
                      {app.interviewDate?.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </p>
                    {app.location && (
                      <p className="text-sm text-muted-foreground">{app.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No interviews on selected date */}
      {selectedDate && selectedDateInterviews.length === 0 && (
        <Card className="w-full mt-6">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No interviews scheduled for {selectedDate.toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
