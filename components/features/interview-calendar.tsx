"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, ClockIcon, BuildingIcon, BriefcaseIcon } from "lucide-react";
import type { Application } from "@/lib/data/job-applications-data";

// React Big Calendar
import { Calendar, dateFnsLocalizer, type Event as RBCEvent } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS } as const;
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

interface InterviewCalendarProps {
  applications: Application[];
}

interface InterviewEvent extends RBCEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  applicationId: string;
}

export function InterviewCalendar({ applications }: InterviewCalendarProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scheduledInterviews = useMemo(
    () => applications.filter((app) => app.status === "Interview" && app.interviewDate),
    [applications]
  );

  const events: InterviewEvent[] = useMemo(() => {
    return scheduledInterviews.map((app) => {
      const startDate = app.interviewDate as Date;
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      return {
        id: app.id,
        title: `${app.company} — ${app.role}`,
        start: startDate,
        end: endDate,
        applicationId: app.id,
        allDay: false,
      } as InterviewEvent;
    });
  }, [scheduledInterviews]);

  const interviewsByDate = useMemo(() => {
    const map: Record<string, Application[]> = {};
    for (const app of scheduledInterviews) {
      const key = (app.interviewDate as Date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(app);
    }
    return map;
  }, [scheduledInterviews]);

  const selectedDateInterviews = selectedDate
    ? interviewsByDate[selectedDate.toDateString()] || []
    : [];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleApplicationClick = (applicationId: string) => {
    router.push(`/application/${applicationId}`);
    handleCloseModal();
  };

  return (
    <div className="w-full">
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
          <div className="w-full">
            <Calendar
              className="rbc-reset text-sm"
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={["month"]}
              defaultView="month"
              date={currentDate}
              onNavigate={setCurrentDate}
              style={{ height: 720, width: "100%" }}
              onSelectEvent={(event: InterviewEvent) => router.push(`/application/${event.applicationId}`)}
              onSelectSlot={(slot: { start: Date; end: Date }) => handleDateSelect(slot.start)}
              selectable
              eventPropGetter={() => {
                return {
                  style: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    borderRadius: "0.375rem",
                    border: "1px solid hsl(var(--border))",
                    padding: "2px 6px",
                  },
                };
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interviews Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Interviews on {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDateInterviews.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No interviews scheduled for {selectedDate?.toLocaleDateString()}
              </p>
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
                className="mt-4"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedDateInterviews.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer hover:shadow-md"
                  onClick={() => handleApplicationClick(app.id)}
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
                      {(app.interviewDate as Date)?.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                    {app.location && (
                      <p className="text-sm text-muted-foreground">{app.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


