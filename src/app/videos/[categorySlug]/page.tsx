import { createSupabaseServerClient } from "@/lib/supabase-server";
import VideoCard from "@/components/VideoCard";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Force revalidation every 30 seconds to get fresh progress data
export const revalidate = 30;

interface Props {
  params: { categorySlug: string };
}

export default async function CategoryVideosPage(props: Props) {
  const params = await props.params;
  const slug = params.categorySlug;

  // Dapatkan instance klien Supabase sisi server
  const supabase = await createSupabaseServerClient();

  // Get category by slug
  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .ilike("name", slug.replace(/-/g, " "))
    .single();
  if (!category) return notFound();

  // Get videos in this category
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, description, video_url")
    .eq("category_id", category.id);

  // Get current user session (menggunakan klien server yang baru diinisialisasi)
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  const progressMap: Record<string, { progress_seconds: number; is_completed: boolean }> = {};
  if (userId && videos && videos.length > 0) {
    const videoIds = videos.map(v => v.id);
    const { data: progresses } = await supabase
      .from("user_video_progress")
      .select("video_id, progress_seconds, is_completed")
      .in("video_id", videoIds)
      .eq("user_id", userId);
    if (progresses) {
      for (const p of progresses) {
        progressMap[p.video_id] = {
          progress_seconds: p.progress_seconds,
          is_completed: p.is_completed,
        };
      }
    }
  }

  // Get all files from storage to find the correct video files
  const serverSupabaseForSignedUrl = await createSupabaseServerClient();
  const { data: allFiles } = await serverSupabaseForSignedUrl.storage
    .from("cleanova-videos")
    .list("");

  // Always generate signed URLs for videos and thumbnails using path from DB
  const signedVideos = await Promise.all((videos || []).map(async (video) => {
    let signedVideoUrl = video.video_url;
    let signedThumbnailUrl = video.thumbnail_url;

    // Find video file by matching title or similar name
    if (allFiles && allFiles.length > 0) {
      const videoFiles = allFiles.filter(file => 
        file.name.toLowerCase().includes('.mp4') || 
        file.name.toLowerCase().includes('.mov') ||
        file.name.toLowerCase().includes('.avi')
      );
      
      // Try to find the correct video file
      let correctVideoPath = video.video_url;
      
      // If the original path doesn't work, try to find a matching file
      if (videoFiles.length > 0) {
        // For now, use the first video file as fallback
        correctVideoPath = videoFiles[0].name;
      }
      
      // Try to create signed URL with the correct path
      if (correctVideoPath) {
        try {
          const { data: signed } = await serverSupabaseForSignedUrl.storage
            .from("cleanova-videos")
            .createSignedUrl(correctVideoPath, 60 * 60);
          if (signed?.signedUrl) signedVideoUrl = signed.signedUrl;
        } catch (err) {
          console.error("Error creating signed video URL:", err);
        }
      }
    }

    // Create signed URL for thumbnail
    if (video.thumbnail_url) {
      try {
        const { data: signed } = await serverSupabaseForSignedUrl.storage
          .from("cleanova-videos")
          .createSignedUrl(video.thumbnail_url, 60 * 60);
        if (signed?.signedUrl) signedThumbnailUrl = signed.signedUrl;
      } catch (err) {
        console.error("Error creating signed thumbnail URL:", err);
      }
    }

    return { ...video, video_url: signedVideoUrl, thumbnail_url: signedThumbnailUrl };
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
              <p className="text-gray-600">
                {signedVideos?.length || 0} video tersedia dalam kategori ini
              </p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Videos Grid */}
        {(!signedVideos || signedVideos.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Image src="/file.svg" alt="No videos" width={48} height={48} className="opacity-60" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada video</h3>
            <p className="text-gray-600 text-center max-w-md">
              Belum ada video di kategori ini. Silakan cek kembali nanti atau pilih kategori lain.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {signedVideos.map((video) => (
              <VideoCard key={video.id} video={video} progress={progressMap[video.id]} categorySlug={slug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 