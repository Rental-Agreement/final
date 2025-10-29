import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Footprints, Train, Bike, Car, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TransportationScoreProps {
  walkScore?: number;
  transitScore?: number;
  bikeScore?: number;
  propertyAddress: string;
}

export function TransportationScore({
  walkScore = 75,
  transitScore = 68,
  bikeScore = 82,
  propertyAddress,
}: TransportationScoreProps) {
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Walker's Paradise";
    if (score >= 70) return "Very Walkable";
    if (score >= 50) return "Somewhat Walkable";
    return "Car-Dependent";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const scores = [
    {
      icon: Footprints,
      label: "Walk Score",
      score: walkScore,
      description: "Daily errands do not require a car",
      color: "blue",
    },
    {
      icon: Train,
      label: "Transit Score",
      score: transitScore,
      description: "Excellent public transportation",
      color: "purple",
    },
    {
      icon: Bike,
      label: "Bike Score",
      score: bikeScore,
      description: "Biking is convenient for most trips",
      color: "green",
    },
  ];

  const averageScore = Math.round((walkScore + transitScore + bikeScore) / 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Transportation
          </CardTitle>
          <Badge variant="outline" className="text-lg font-bold">
            <TrendingUp className="w-4 h-4 mr-1" />
            {averageScore}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {getScoreLabel(averageScore)} - {propertyAddress}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {scores.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${item.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{item.label}</h4>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(item.score)}`}>
                    {item.score}
                  </div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
              <div className="relative">
                <Progress value={item.score} className="h-2" />
                <div 
                  className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Overall Summary */}
        <div className="pt-4 border-t">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Overall Transportation Score</h4>
                <p className="text-sm text-muted-foreground">
                  This location is highly accessible with multiple transport options
                </p>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {averageScore}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Facts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-accent rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Nearest Metro</div>
            <div className="font-semibold">0.8 km</div>
          </div>
          <div className="bg-accent rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Bus Stops</div>
            <div className="font-semibold">3 nearby</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
