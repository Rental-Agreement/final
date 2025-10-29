import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Maximize2, Volume2, VolumeX, RotateCw, Move } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VirtualTourProps {
  videoUrl?: string;
  images360?: string[];
  propertyName: string;
}

export function VirtualTour({ videoUrl, images360, propertyName }: VirtualTourProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [current360Index, setCurrent360Index] = useState(0);
  const [is360Mode, setIs360Mode] = useState(false);

  // Simulate 360 rotation
  const [rotation, setRotation] = useState(0);

  const handleRotate = (direction: "left" | "right") => {
    setRotation((prev) => prev + (direction === "left" ? -30 : 30));
  };

  if (!videoUrl && (!images360 || images360.length === 0)) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <RotateCw className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Virtual Tour Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              360° views and video walkthroughs will be available soon
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <RotateCw className="w-5 h-5" />
          Virtual Tour
        </h3>
        <div className="flex gap-2">
          {videoUrl && (
            <Badge variant={!is360Mode ? "default" : "outline"} className="cursor-pointer" onClick={() => setIs360Mode(false)}>
              <Play className="w-3 h-3 mr-1" />
              Video
            </Badge>
          )}
          {images360 && images360.length > 0 && (
            <Badge variant={is360Mode ? "default" : "outline"} className="cursor-pointer" onClick={() => setIs360Mode(true)}>
              <Move className="w-3 h-3 mr-1" />
              360° View
            </Badge>
          )}
        </div>
      </div>

      <Card className="relative overflow-hidden bg-black aspect-video">
        {/* Video Mode */}
        {!is360Mode && videoUrl && (
          <div className="relative w-full h-full">
            <video
              className="w-full h-full object-cover"
              src={videoUrl}
              muted={isMuted}
              loop
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              id="tour-video"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => {
                      const video = document.getElementById("tour-video") as HTMLVideoElement;
                      if (video) {
                        if (isPlaying) video.pause();
                        else video.play();
                      }
                    }}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    const video = document.getElementById("tour-video") as HTMLVideoElement;
                    if (video) video.requestFullscreen();
                  }}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 360° Mode */}
        {is360Mode && images360 && images360.length > 0 && (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={images360[current360Index]}
              alt={`360° view ${current360Index + 1}`}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            
            {/* 360 Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleRotate("left")}
                  >
                    <RotateCw className="w-4 h-4 rotate-180" />
                  </Button>
                  <span className="text-white text-xs font-medium px-2">
                    {current360Index + 1} / {images360.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleRotate("right")}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  {images360.map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === current360Index ? "bg-white w-6" : "bg-white/50"
                      }`}
                      onClick={() => setCurrent360Index(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tour Type Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-black/60 text-white border-white/20 backdrop-blur-sm">
            <Move className="w-3 h-3 mr-1" />
            Interactive Tour
          </Badge>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        {is360Mode 
          ? "Click the rotation buttons to explore the 360° view"
          : "Experience a video walkthrough of the property"
        }
      </p>
    </div>
  );
}
