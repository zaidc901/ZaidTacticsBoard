import type { BoardFormat } from '../types/domain';

export const BOARD_ZOOM_MIN = 0.8;
export const BOARD_ZOOM_MAX = 3;
export const BOARD_ZOOM_STEP = 0.1;
export const boardZoomBaseline = (format: BoardFormat) => format === 'portrait' ? 1.5 : 1;
export const boardFitZoom = (format: BoardFormat) => 1 / boardZoomBaseline(format);
export const boardZoomMin = (format: BoardFormat) => format === 'portrait' ? 0.5 : BOARD_ZOOM_MIN;
export const clampBoardZoom = (zoom: number, format: BoardFormat = 'landscape') => Math.max(boardZoomMin(format), Math.min(BOARD_ZOOM_MAX, Number.isFinite(zoom) ? zoom : 1));

/** Match displayed pixels after CSS zoom, with a bounded backing-store budget. */
export function boardCanvasPixelRatio(width: number, height: number, magnification: number, deviceRatio: number, touch: boolean) {
  const target = Math.max(1, magnification * Math.min(2, Math.max(1, deviceRatio)));
  const budget = touch ? 4_000_000 : 8_000_000;
  return Math.min(target, Math.max(1, Math.sqrt(budget / Math.max(1, width * height))));
}
