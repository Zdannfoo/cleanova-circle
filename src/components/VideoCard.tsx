"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface VideoCardProps {
  video: { id: string; title: string; thumbnail_url: string; description?: string };
  progress?: { progress_seconds: number; is_completed: boolean; };
  categorySlug: string;
}

export default function VideoCard({ video, progress, categorySlug }: VideoCardProps) {
  const router = useRouter();
  
  return (
    <div
      className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
      onClick={() => router.push(`/videos/${categorySlug}/${video.id}`)}
    >
      {/* Thumbnail Container */}
      <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={video.thumbnail_url || "/file.svg"}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            {categorySlug.replace(/-/g, ' ')}
          </span>
        </div>
        
        {/* Progress Overlay */}
        {progress && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progress.is_completed ? "bg-green-400" : "bg-blue-400"}`}
                style={{ width: progress.is_completed ? "100%" : `${Math.min(100, Math.round((progress.progress_seconds / 120) * 100))}%` }}
              />
            </div>
            <div className="text-white text-xs mt-1">
              {progress.is_completed ? "Selesai" : `${Math.min(100, Math.round((progress.progress_seconds / 120) * 100))}% Selesai`}
            </div>
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {video.description}
          </p>
        )}
        
        {/* Action Button */}
        <div className="flex items-center justify-between">
          <span className="text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
            Tonton Video
          </span>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
} 