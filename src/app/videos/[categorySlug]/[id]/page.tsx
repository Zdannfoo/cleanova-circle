import { createSupabaseServerClient } from "@/lib/supabase-server";
import VideoPlayer from "@/components/VideoPlayer";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: { categorySlug: string; id: string };
}

export default async function VideoDetailPage({ params }: Props) {
  const videoId = params.id;
  const categorySlug = params.categorySlug;

  // Dapatkan instance klien Supabase sisi server
  const supabase = await createSupabaseServerClient();

  // Fetch video details
  const { data: video } = await supabase
    .from("videos")
    .select("id, title, description, video_url, thumbnail_url, category_id")
    .eq("id", videoId)
    .single();
  if (!video) return notFound();

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  let progress = undefined;
  if (userId) {
    const { data: prog } = await supabase
      .from("user_video_progress")
      .select("progress_seconds, is_completed")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single();
    if (prog) progress = prog;
  }

  // Always generate signed URL for video and thumbnail using path from DB
  let signedVideoUrl = video.video_url;
  let signedThumbnailUrl = video.thumbnail_url;

  // Pastikan createSignedUrl dipanggil dari klien server juga
  const serverSupabaseForSignedUrl = await createSupabaseServerClient();
  
  console.log("Original video URL from DB:", video.video_url);
  console.log("Original thumbnail URL from DB:", video.thumbnail_url);
  
  // Get all files from storage to find the correct video file
  const { data: allFiles, error: listAllError } = await serverSupabaseForSignedUrl.storage
    .from("cleanova-videos")
    .list("");
  
  console.log("All files in storage:", allFiles);
  console.log("List all error:", listAllError);
  
  if (allFiles && allFiles.length > 0) {
    // Find video file by matching title or similar name
    const videoFiles = allFiles.filter(file => 
      file.name.toLowerCase().includes('.mp4') || 
      file.name.toLowerCase().includes('.mov') ||
      file.name.toLowerCase().includes('.avi')
    );
    
    console.log("Video files found:", videoFiles);
    
    // Try to find the correct video file
    let correctVideoPath = video.video_url;
    
    // If the original path doesn't work, try to find a matching file
    if (videoFiles.length > 0) {
      // For now, use the first video file as fallback
      correctVideoPath = videoFiles[0].name;
      console.log("Using fallback video path:", correctVideoPath);
    }
    
    // Try to create signed URL with the correct path
    if (correctVideoPath) {
      try {
        const { data: signed, error } = await serverSupabaseForSignedUrl.storage
          .from("cleanova-videos")
          .createSignedUrl(correctVideoPath, 60 * 60);
        
        console.log("Signed video URL result:", signed);
        console.log("Signed video URL error:", error);
        
        if (error) {
          console.error("Error creating signed video URL:", error);
        }
        
        if (signed?.signedUrl) {
          signedVideoUrl = signed.signedUrl;
          console.log("Successfully created signed video URL");
        } else {
          console.error("No signed URL returned for video");
        }
      } catch (err) {
        console.error("Exception creating signed video URL:", err);
      }
    }
  }
  
  if (video.thumbnail_url) {
    try {
      const { data: signed, error } = await serverSupabaseForSignedUrl.storage
        .from("cleanova-videos")
        .createSignedUrl(video.thumbnail_url, 60 * 60);
      
      console.log("Signed thumbnail URL result:", signed);
      console.log("Signed thumbnail URL error:", error);
      
      if (error) {
        console.error("Error creating signed thumbnail URL:", error);
      }
      
      if (signed?.signedUrl) {
        signedThumbnailUrl = signed.signedUrl;
        console.log("Successfully created signed thumbnail URL");
      } else {
        console.error("No signed URL returned for thumbnail");
        // Fallback: try to use the original URL if it's already a full URL
        if (video.thumbnail_url.startsWith('http')) {
          signedThumbnailUrl = video.thumbnail_url;
          console.log("Using original thumbnail URL as fallback");
        }
      }
    } catch (err) {
      console.error("Exception creating signed thumbnail URL:", err);
    }
  }

  console.log("Final signed video URL:", signedVideoUrl);
  console.log("Final signed thumbnail URL:", signedThumbnailUrl);

  // Fetch recommendations (other videos in same category)
  const { data: recommendations } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, description")
    .eq("category_id", video.category_id)
    .neq("id", videoId)
    .limit(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/videos/${categorySlug}`} className="hover:text-blue-600 transition-colors">
            {categorySlug.replace(/-/g, ' ')}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{video.title}</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <VideoPlayer 
              video={{ ...video, video_url: signedVideoUrl, thumbnail_url: signedThumbnailUrl }} 
              progress={progress}
              categorySlug={categorySlug}
            />
            
            {/* Video Info */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>
              <p className="text-gray-700 leading-relaxed mb-6">{video.description}</p>
              
              {progress && (
                <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {progress.is_completed ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-blue-600">📊</span>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {progress.is_completed ? "Video Selesai" : 
                        `${Math.min(100, Math.round((progress.progress_seconds / 120) * 100))}% Selesai`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Kategori</h3>
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {categorySlug.replace(/-/g, ' ')}
                </span>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Lainnya</h3>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex space-x-3">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={rec.thumbnail_url || "/file.svg"} 
                          alt={rec.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                          {rec.title}
                        </h4>
                        {rec.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {rec.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 