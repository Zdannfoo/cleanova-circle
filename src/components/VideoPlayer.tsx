"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface VideoPlayerProps {
  video: { id: string; video_url: string; thumbnail_url?: string; title?: string };
  progress?: { progress_seconds: number; is_completed: boolean };
  categorySlug?: string;
}

export default function VideoPlayer({ video, progress: initialProgress, categorySlug }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(initialProgress?.progress_seconds || 0);
  const [isCompleted, setIsCompleted] = useState(initialProgress?.is_completed || false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSavedProgress, setLastSavedProgress] = useState(0);

  // Debug: Log video URL
  useEffect(() => {
    console.log("Video URL:", video.video_url);
    console.log("Thumbnail URL:", video.thumbnail_url);
    
    // Check if video URL is valid
    if (!video.video_url || video.video_url.trim() === '') {
      setError("URL video tidak valid");
      setLoading(false);
      return;
    }
    
    // Check if URL starts with http or https
    if (!video.video_url.startsWith('http')) {
      setError("URL video tidak valid");
      setLoading(false);
      return;
    }
  }, [video.video_url, video.thumbnail_url]);

  // Set initial progress on mount
  useEffect(() => {
    if (videoRef.current && initialProgress?.progress_seconds) {
      videoRef.current.currentTime = initialProgress.progress_seconds;
    }
    setProgress(initialProgress?.progress_seconds || 0);
    setIsCompleted(initialProgress?.is_completed || false);
    setLastSavedProgress(initialProgress?.progress_seconds || 0);
    setLoading(false);
    // eslint-disable-next-line
  }, [video.id, initialProgress?.progress_seconds]);

  // Upsert progress
  const upsertProgress = async (currentTime: number, completed: boolean = false) => {
    try {
      // Validate input data
      if (!video.id || typeof currentTime !== 'number' || currentTime < 0) {
        console.error("Invalid input data for progress save:", { videoId: video.id, currentTime });
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        return;
      }
      
      if (!user) {
        console.log("No user found, skipping progress save");
        return;
      }
      
      console.log("Saving progress:", { 
        currentTime, 
        completed, 
        videoId: video.id,
        userId: user.id 
      });
      
      const progressData = {
        user_id: user.id,
        video_id: video.id,
        progress_seconds: Math.floor(currentTime),
        is_completed: completed,
      };
      
      console.log("Progress data to save:", progressData);
      
      // Check if record exists first
      const { data: existingRecord, error: checkError } = await supabase
        .from("user_video_progress")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", video.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error if no record
      
      if (checkError) {
        console.error("Error checking existing record:", checkError.message);
        // If table doesn't exist or permission denied, just log and continue
        console.log("Skipping progress save due to database error");
        return;
      }
      
      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_video_progress")
          .update({
            progress_seconds: Math.floor(currentTime),
            is_completed: completed,
          })
          .eq("user_id", user.id)
          .eq("video_id", video.id);
        
        if (updateError) {
          console.error("Update failed:", updateError.message);
          console.error("Full error object:", updateError);
        } else {
          console.log("Progress updated successfully");
          setLastSavedProgress(currentTime);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from("user_video_progress")
          .insert(progressData);
        
        if (insertError) {
          console.error("Insert failed:", insertError.message);
          console.error("Full error object:", insertError);
        } else {
          console.log("Progress inserted successfully");
          setLastSavedProgress(currentTime);
        }
      }
    } catch (err) {
      console.error("Exception saving progress:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error stack:", err.stack);
      }
    }
  };

  // Handle time update
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    let interval: NodeJS.Timeout;
    
    const onTimeUpdate = () => {
      const currentTime = videoEl.currentTime;
      const percent = (currentTime / videoEl.duration) * 100;
      setProgress(currentTime);
      
      // Save progress every 30 seconds or when significant progress is made (30+ seconds)
      if (Math.abs(currentTime - lastSavedProgress) >= 30) {
        upsertProgress(currentTime, isCompleted);
      }
      
      if (percent >= 95 && !isCompleted) {
        setIsCompleted(true);
        upsertProgress(currentTime, true);
      }
    };
    
    const onPause = () => {
      const currentTime = videoEl.currentTime;
      upsertProgress(currentTime, isCompleted);
    };
    
    const onEnded = () => {
      upsertProgress(videoEl.duration, true);
    };
    
    const onSeeked = () => {
      const currentTime = videoEl.currentTime;
      upsertProgress(currentTime, isCompleted);
    };
    
    const onLoadedData = () => {
      console.log("Video loaded successfully");
      setLoading(false);
      setError(null);
    };
    
    const onError = (e: Event) => {
      console.error("Video error:", e);
      const videoError = videoEl.error;
      let errorMessage = "Gagal memuat video";
      
      if (videoError) {
        switch (videoError.code) {
          case 1:
            errorMessage = "Video tidak dapat dimuat";
            break;
          case 2:
            errorMessage = "Video tidak dapat diputar";
            break;
          case 3:
            errorMessage = "Video tidak dapat diunduh";
            break;
          case 4:
            errorMessage = "Format video tidak didukung";
            break;
          default:
            errorMessage = `Error: ${videoError.message}`;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    };
    
    const onLoadStart = () => {
      console.log("Video loading started");
      setLoading(true);
      setError(null);
    };
    
    const onCanPlay = () => {
      console.log("Video can play");
      setLoading(false);
      setError(null);
    };
    
    const onLoad = () => {
      console.log("Video loaded");
      setLoading(false);
      setError(null);
    };
    
    videoEl.addEventListener("timeupdate", onTimeUpdate);
    videoEl.addEventListener("pause", onPause);
    videoEl.addEventListener("ended", onEnded);
    videoEl.addEventListener("seeked", onSeeked);
    videoEl.addEventListener("loadeddata", onLoadedData);
    videoEl.addEventListener("error", onError);
    videoEl.addEventListener("loadstart", onLoadStart);
    videoEl.addEventListener("canplay", onCanPlay);
    videoEl.addEventListener("load", onLoad);
    
    // Save progress every 30 seconds as backup
    interval = setInterval(() => {
      if (!videoEl.paused && !videoEl.ended) {
        upsertProgress(videoEl.currentTime, isCompleted);
      }
    }, 30000);
    
    return () => {
      videoEl.removeEventListener("timeupdate", onTimeUpdate);
      videoEl.removeEventListener("pause", onPause);
      videoEl.removeEventListener("ended", onEnded);
      videoEl.removeEventListener("seeked", onSeeked);
      videoEl.removeEventListener("loadeddata", onLoadedData);
      videoEl.removeEventListener("error", onError);
      videoEl.removeEventListener("loadstart", onLoadStart);
      videoEl.removeEventListener("canplay", onCanPlay);
      videoEl.removeEventListener("load", onLoad);
      clearInterval(interval);
    };
  }, [isCompleted, video.id, lastSavedProgress]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // If no valid video URL, show error
  if (!video.video_url || video.video_url.trim() === '' || !video.video_url.startsWith('http')) {
    return (
      <div className="w-full flex flex-col gap-4">
        {/* Navigation */}
        {categorySlug && (
          <div className="flex items-center space-x-2 mb-4">
            <Link
              href={`/videos/${categorySlug}`}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Kategori</span>
            </Link>
          </div>
        )}
        
        <div className="relative w-full aspect-video rounded-xl shadow-lg overflow-hidden bg-gray-100">
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50">
            <div className="text-red-500 text-center mb-4">
              <div className="font-medium text-lg">Error</div>
              <div className="text-sm">URL video tidak valid atau file tidak ditemukan</div>
            </div>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Navigation */}
      {categorySlug && (
        <div className="flex items-center space-x-2 mb-4">
          <Link
            href={`/videos/${categorySlug}`}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Kategori</span>
          </Link>
        </div>
      )}
      
      {/* Video Player */}
      <div className="relative w-full aspect-video rounded-xl shadow-lg overflow-hidden bg-gray-100">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-500">Memuat video...</div>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50">
            <div className="text-red-500 text-center mb-4">
              <div className="font-medium text-lg">Error</div>
              <div className="text-sm">{error}</div>
            </div>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Coba Lagi
            </button>
          </div>
        )}
        <video
          ref={videoRef}
          src={video.video_url}
          controls
          className="w-full h-full object-contain"
          poster={video.thumbnail_url}
          preload="metadata"
          key={retryCount} // Force re-render on retry
        />
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full ${isCompleted ? "bg-green-500" : "bg-blue-500"} transition-all duration-300`}
          style={{ width: isCompleted ? "100%" : `${Math.min(100, (progress / 120) * 100)}%` }}
        />
      </div>
      
      {/* Progress Text */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {isCompleted
            ? "✅ Selesai"
            : `📊 ${Math.min(100, Math.round((progress / 120) * 100))}% Selesai`}
        </span>
        {videoRef.current && (
          <span>
            {Math.floor(progress)}s / {Math.floor(videoRef.current.duration || 120)}s
          </span>
        )}
      </div>
    </div>
  );
} 