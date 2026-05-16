'use client';

import { Bug, RefreshCw, Trash2, X } from 'lucide-react';
import { PointerEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ApiDebugEntry {
  id: string;
  label: string;
  method: string;
  backendEndpoint: string;
  nextEndpoint: string;
  nextService: string;
  replayUrl?: string;
  payload?: unknown;
  status?: number;
  response?: unknown;
  error?: string;
  createdAt: string;
  replayable?: boolean;
}

interface ApiDebugInspectorProps {
  entries: ApiDebugEntry[];
  onClear: () => void;
  onReplay: (entry: ApiDebugEntry) => void;
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-56 overflow-auto rounded-lg bg-[#17120f] p-3 text-[11px] leading-5 text-[#f8efe8]">
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

export function ApiDebugInspector({ entries, onClear, onReplay }: ApiDebugInspectorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const longPressTimerRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    active: boolean;
    dragged: boolean;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clampPosition = (x: number, y: number) => {
    if (typeof window === 'undefined') return { x, y };

    return {
      x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - 96)),
      y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - 72)),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);

    const nextDragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      active: false,
      dragged: false,
    };

    setDragState({
      ...nextDragState,
    });

    longPressTimerRef.current = window.setTimeout(() => {
      setDragState((current) =>
        current?.pointerId === event.pointerId
          ? { ...current, active: true }
          : current,
      );
    }, 350);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.active) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        setDragState(null);
      }
      return;
    }

    const next = clampPosition(dragState.originX - deltaX, dragState.originY - deltaY);

    setPosition(next);
    setDragState({
      ...dragState,
      dragged: dragState.dragged || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (dragState?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setDragState(null);
    }
  };

  const handleClick = () => {
    if (dragState?.active || dragState?.dragged) return;
    setOpen(true);
  };

  if (!mounted) return null;

  return createPortal(
    <div dir="ltr" className="text-left">
      <button
        type="button"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`fixed flex h-14 min-w-14 touch-none select-none items-center justify-center gap-2 rounded-full border border-[#4a2b1a] bg-[#311C11] px-4 text-left text-white shadow-[0_16px_40px_rgba(49,28,17,0.32)] transition hover:scale-105 ${
          dragState?.active ? 'cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{ right: position.x, bottom: position.y, zIndex: 2147483647 }}
        aria-label="Open API debug inspector"
        title="Click to inspect API calls."
      >
        <Bug className="h-5 w-5" />
        <span className="text-xs font-bold tracking-wide">API</span>
      </button>

      {open ? (
        <div dir="ltr" className="fixed inset-0 bg-black/45 p-4 text-left" style={{ zIndex: 2147483647 }}>
          <div className="ml-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-left shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#eadfd9] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#2b1a12]">API Debug Inspector</h2>
                <p className="text-xs text-[#7a6c63]">Development only. Shows backend and Next service-side calls for this page.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#eadfd9] px-3 py-2 text-xs font-semibold text-[#2b1a12] transition hover:bg-[#f6eee7]"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-[#5b5b5b] transition hover:bg-[#f6eee7] hover:text-black"
                  aria-label="Close API debug inspector"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {entries.length ? (
                entries.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-[#d9c8ba] bg-[#fffaf6] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#2b1a12]">{entry.label}</div>
                        <div className="text-xs text-[#7a6c63]">{entry.createdAt}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.replayable !== false ? (
                          <button
                            type="button"
                            onClick={() => onReplay(entry)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d9c8ba] bg-white px-3 py-1 text-xs font-semibold text-[#2b1a12] transition hover:bg-[#f6eee7]"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Redo
                          </button>
                        ) : null}

                        <div className="rounded-full bg-[#311C11] px-3 py-1 text-xs font-semibold text-white">
                          {entry.method} {entry.status ?? 'pending'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#4f4038]">
                      <div>
                        <span className="font-semibold">BE endpoint: </span>
                        <span className="break-all">{entry.backendEndpoint}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Next endpoint: </span>
                        <span className="break-all">{entry.nextEndpoint}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Next service: </span>
                        <span className="break-all">{entry.nextService}</span>
                      </div>
                    </div>

                    {entry.payload !== undefined ? (
                      <div className="mt-3">
                        <div className="mb-1 text-xs font-semibold text-[#2b1a12]">Payload / query</div>
                        <JsonBlock value={entry.payload} />
                      </div>
                    ) : null}

                    <div className="mt-3">
                      <div className="mb-1 text-xs font-semibold text-[#2b1a12]">
                        {entry.error ? 'Error' : 'Response'}
                      </div>
                      <JsonBlock value={entry.error ? { message: entry.error } : entry.response} />
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-[#d9c8ba] p-8 text-center text-sm text-[#7a6c63]">
                  No API calls recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
