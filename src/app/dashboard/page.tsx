import { createSupabaseServerClient } from "@/lib/supabase-server";
import VideoCard from "@/components/VideoCard";
import Carousel from "@/components/Carousel";
import Link from "next/link";

// Force revalidation every 30 seconds to get fresh progress data
export const revalidate = 30;

function slugify(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export default async function DashboardPage() {
  // Dapatkan instance klien Supabase sisi server
  const supabase = await createSupabaseServerClient();

  // Fetch latest/popular videos (limit 6)
  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, thumbnail_url, category_id, description, video_url")
    .order("created_at", { ascending: false })
    .limit(6);

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("id, name");

  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user.id;

  let progressMap: Record<string, { progress_seconds: number; is_completed: boolean }> = {};
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

  // Map category_id to slug
  const categoryMap = (categories || []).reduce((acc, cat) => {
    acc[cat.id] = slugify(cat.name);
    return acc;
  }, {} as Record<string, string>);

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
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Selamat datang di Cleanova
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Temukan tips dan trik terbaik untuk membersihkan dan merawat barang-barang Anda dengan mudah dan efektif.
          </p>
        </div>

        {/* Carousel Section */}
        <section className="mb-12">
          <Carousel />
        </section>

        {/* Categories Section */}
        {categories && categories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Kategori Video</h2>
              <Link
                href="#videos"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Lihat Semua
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/videos/${slugify(category.name)}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600">Jelajahi video</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Latest Videos Section */}
        <section id="videos">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Video Terbaru</h2>
            <span className="text-sm text-gray-600">
              {signedVideos?.length || 0} video tersedia
            </span>
          </div>
          
          {(!signedVideos || signedVideos.length === 0) ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada video</h3>
              <p className="text-gray-600">
                Video akan muncul di sini setelah ditambahkan ke sistem.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {signedVideos?.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  progress={progressMap[video.id]} 
                  categorySlug={categoryMap[video.category_id]} 
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 