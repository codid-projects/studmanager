"use client";

import { FC } from "react";
import { useLocale } from "@/lib/locale-context";

interface HorseVideosTabProps {
  horse?: {
    raw?: {
      videos?: string[] | null;
    };
  };
}

function getYoutubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname.startsWith("/embed/")) return url;

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function videoTitle(url: string, index: number, isRTL: boolean) {
  try {
    const parsed = new URL(url);
    const fileName = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || "");
    return fileName || `${isRTL ? "فيديو" : "Video"} ${index + 1}`;
  } catch {
    return `${isRTL ? "فيديو" : "Video"} ${index + 1}`;
  }
}

export const HorseVideosTab: FC<HorseVideosTabProps> = ({ horse }) => {
  const { direction } = useLocale();
  const isRTL = direction === "rtl";
  const videos = (horse?.raw?.videos ?? []).filter((url): url is string => Boolean(url?.trim()));

  if (!videos.length) return null;

  return (
    <div className={`mb-12 ${isRTL ? "text-right" : "text-left"}`}>
      <h2 className="mb-6 text-2xl font-bold text-[#2a2a2a]">
        {isRTL ? "الفيديوهات" : "Videos"}
      </h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {videos.map((url, index) => {
          const youtubeUrl = getYoutubeEmbedUrl(url);
          const title = videoTitle(url, index, isRTL);

          return (
            <div
              key={`${url}-${index}`}
              className="overflow-hidden rounded-2xl bg-black shadow-sm"
            >
              <div className="relative aspect-video w-full">
                {youtubeUrl ? (
                  <iframe
                    src={youtubeUrl}
                    title={title}
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={url}
                    controls
                    preload="metadata"
                    className="absolute inset-0 h-full w-full bg-black object-contain"
                  />
                )}
              </div>
              <div className="border-t border-gray-200 bg-[#fdfbf7] p-4">
                <h3 className="truncate text-lg font-medium text-[#2a2a2a]">
                  {title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
