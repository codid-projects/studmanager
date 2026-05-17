import { FC, useState, useEffect } from "react";
import { useLocale, useTranslation } from "@/lib/locale-context";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface HorsePhotosTabProps {
  horse?: any;
}

export const HorsePhotosTab: FC<HorsePhotosTabProps> = ({ horse }) => {
  const { direction } = useLocale();
  const { t } = useTranslation();
  const isRTL = direction === "rtl";
  const photos = horse?.raw?.images?.filter(Boolean) ?? [];
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
      if (e.key === "ArrowLeft") {
        if (isRTL) {
          handleNext(); // In RTL, left arrow means next image logically
        } else {
          handlePrev(); // In LTR, left arrow means previous image logically
        }
      }
      if (e.key === "ArrowRight") {
        if (isRTL) {
          handlePrev(); // In RTL, right arrow means previous image logically
        } else {
          handleNext(); // In LTR, right arrow means next image logically
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedIdx, isRTL]);

  const handleNext = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
  };

  return (
    <div className={`mb-12 ${isRTL ? "text-right" : "text-left"}`}>
      <h2 className="text-2xl font-bold text-[#2a2a2a] mb-6">
        {isRTL ? "الصور" : "Photos"}
      </h2>
      
      {photos.length ? (
        <div className="flex flex-wrap gap-3">
          {photos.map((photo: string, i: number) => (
          <div 
            key={i} 
            onClick={() => setSelectedIdx(i)}
            className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg"
            style={{ 
              height: '300px',
              flexGrow: i % 3 === 0 ? 1.5 : 1,
              flexBasis: i % 3 === 0 ? '40%' : '25%',
              minWidth: '280px'
            }}
          >
            <img 
              src={photo} 
              alt={`Horse photo ${i + 1}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <div className="flex flex-col items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                 <Maximize2 className="w-6 h-6 text-white" />
                 <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                   {t("horses.viewFull")}
                 </span>
               </div>
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d9c8ba] bg-white p-10 text-center text-sm text-[#7a6c63]">
          {t("common.noRecordsFound")}
        </div>
      )}

      {/* Full Screen Modal */}
      {selectedIdx !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedIdx(null);
          }}
        >
          {/* Close Button */}
          <button 
            onClick={() => setSelectedIdx(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[110]"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Main Stage */}
          <div
            className="relative w-full h-full flex items-center justify-center p-4 md:p-20"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedIdx(null);
            }}
          >
            {/* Arrows */}
            <button 
              onClick={(e) => { e.stopPropagation(); isRTL ? handleNext() : handlePrev(); }}
              className={`absolute ${isRTL ? 'right-4 md:right-10' : 'left-4 md:left-10'} p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-[110]`}
            >
              {isRTL ? <ChevronRight className="w-10 h-10" /> : <ChevronLeft className="w-10 h-10" />}
            </button>

            <div
              className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setSelectedIdx(null);
              }}
            >
              <img 
                src={photos[selectedIdx]} 
                alt="Selected horse" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                onMouseDown={(event) => event.stopPropagation()}
              />
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); isRTL ? handlePrev() : handleNext(); }}
              className={`absolute ${isRTL ? 'left-4 md:left-10' : 'right-4 md:right-10'} p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 z-[110]`}
            >
              {isRTL ? <ChevronLeft className="w-10 h-10" /> : <ChevronRight className="w-10 h-10" />}
            </button>
          </div>

          {/* Thumbnails Strip */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center px-4 overflow-x-auto no-scrollbar gap-3 pb-4">
             {photos.map((photo: string, i: number) => (
               <button 
                 key={i}
                 onClick={() => setSelectedIdx(i)}
                 className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ${
                   selectedIdx === i ? 'ring-2 ring-white scale-110 shadow-lg z-10' : 'opacity-40 hover:opacity-100'
                 }`}
               >
                 <img src={photo} alt="" className="w-full h-full object-cover" />
               </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
