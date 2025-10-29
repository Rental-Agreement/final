import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full">
      {/* Image Skeleton with shimmer */}
      <div className="relative h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%]">
        <div className="absolute top-3 right-3 flex gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full" />
        </div>
        <div className="absolute bottom-3 left-3">
          <Skeleton className="w-24 h-6 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Title */}
        <Skeleton className="h-5 w-3/4 mb-2" />
        
        {/* Location */}
        <Skeleton className="h-4 w-1/2 mb-3" />

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Price */}
        <Skeleton className="h-6 w-32 mb-1" />
        <Skeleton className="h-3 w-40 mb-3" />

        {/* Buttons */}
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="h-9 flex-1 rounded-md" />
        </div>
      </div>
    </Card>
  );
}
