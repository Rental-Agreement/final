import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, Home, LogOut } from "lucide-react";

interface BookingTimelineProps {
  checkInDate?: string;
  checkOutDate?: string;
  totalDays?: number;
  status?: "upcoming" | "current" | "completed";
}

export function BookingTimeline({
  checkInDate = "2025-11-15",
  checkOutDate = "2026-11-14",
  totalDays = 365,
  status = "upcoming",
}: BookingTimelineProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = () => {
    switch (status) {
      case "current": return "bg-green-100 text-green-800 border-green-200";
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed": return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "current": return "Active Lease";
      case "upcoming": return "Upcoming";
      case "completed": return "Completed";
    }
  };

  const days = getDaysDifference(checkInDate, checkOutDate);
  const months = Math.floor(days / 30);

  const timelineSteps = [
    {
      icon: Calendar,
      title: "Check-in",
      date: checkInDate,
      time: "After 2:00 PM",
      description: "Pick up keys and move in",
      color: "blue",
      completed: status !== "upcoming",
    },
    {
      icon: Home,
      title: "Your Stay",
      date: "",
      time: `${months} months`,
      description: `${days} days total`,
      color: "green",
      completed: status === "completed",
    },
    {
      icon: LogOut,
      title: "Check-out",
      date: checkOutDate,
      time: "Before 11:00 AM",
      description: "Return keys and vacate",
      color: "orange",
      completed: status === "completed",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Booking Timeline
          </CardTitle>
          <Badge className={getStatusColor()}>
            {getStatusLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Timeline */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-300 via-green-300 to-orange-300" />

          {/* Timeline Steps */}
          <div className="space-y-8">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    step.completed 
                      ? `bg-${step.color}-100 border-2 border-${step.color}-500` 
                      : "bg-gray-100 border-2 border-gray-300"
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className={`w-6 h-6 text-${step.color}-600`} />
                    ) : (
                      <Icon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold">{step.title}</h4>
                        {step.date && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {formatDate(step.date)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {step.description}
                      </p>
                      <p className={`text-xs font-medium ${
                        step.completed ? `text-${step.color}-600` : "text-muted-foreground"
                      }`}>
                        {step.time}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{months}</div>
              <div className="text-xs text-muted-foreground">Months</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.ceil(days / 7)}
              </div>
              <div className="text-xs text-muted-foreground">Weeks</div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mt-4 space-y-2">
          <h4 className="font-semibold text-sm">Important Information</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Check-in time: After 2:00 PM on {formatDate(checkInDate)}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Check-out time: Before 11:00 AM on {formatDate(checkOutDate)}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <span>Security deposit refunded within 7 days after check-out</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
