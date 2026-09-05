import type Konva from 'konva';
import type { ExportRegion } from '../types/domain';

export function download(filename: string, href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

function regionLabel(region: ExportRegion) {
  return region === 'full' ? 'full-board' : `${region}-half`;
}

function regionRect(width: number, height: number, region: ExportRegion) {
  if (region === 'top') return { x: 0, y: 0, width, height: Math.round(height / 2) };
  if (region === 'bottom') {
    const nextHeight = Math.round(height / 2);
    return { x: 0, y: height - nextHeight, width, height: nextHeight };
  }
  if (region === 'left') return { x: 0, y: 0, width: Math.round(width / 2), height };
  if (region === 'right') {
    const nextWidth = Math.round(width / 2);
    return { x: width - nextWidth, y: 0, width: nextWidth, height };
  }
  return { x: 0, y: 0, width, height };
}

function cropCanvas(source: HTMLCanvasElement, region: ExportRegion) {
  const rect = regionRect(source.width, source.height, region);
  if (region === 'full') return source;
  const output = document.createElement('canvas');
  output.width = rect.width;
  output.height = rect.height;
  const ctx = output.getContext('2d');
  if (!ctx) return source;
  ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
  return output;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.95) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas export failed')), type, quality);
  });
}

export async function exportStageImage(stage: Konva.Stage, type: 'png' | 'jpeg' = 'png', region: ExportRegion = 'full') {
  stage.batchDraw();
  await nextFrame();
  const scale = stage.scaleX() || 1;
  const pixelRatio = Math.max(2, 2 / scale);
  const mimeType = `image/${type}`;
  const canvas = cropCanvas(stage.toCanvas({ pixelRatio }), region);
  const blob = await canvasToBlob(canvas, mimeType);
  const href = URL.createObjectURL(blob);
  download(`tactical-board-${regionLabel(region)}.${type === 'jpeg' ? 'jpg' : 'png'}`, href);
  URL.revokeObjectURL(href);
}

function bestVideoMimeType() {
  const types = [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) ?? '';
}

export async function recordStageAnimation(stage: Konva.Stage, render: (captureFrame: () => void) => Promise<void>, fps = 30, region: ExportRegion = 'full') {
  const scale = stage.scaleX() || 1;
  const pixelRatio = Math.max(1, 1 / scale);
  const fullWidth = Math.round(stage.width() * pixelRatio);
  const fullHeight = Math.round(stage.height() * pixelRatio);
  const rect = regionRect(fullWidth, fullHeight, region);
  const output = document.createElement('canvas');
  output.width = rect.width;
  output.height = rect.height;
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Canvas recording is not available');
  const stream = output.captureStream(fps);
  const mimeType = bestVideoMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };

  const captureFrame = () => {
    stage.batchDraw();
    const source = stage.toCanvas({ pixelRatio });
    ctx.clearRect(0, 0, output.width, output.height);
    ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, output.width, output.height);
  };

  recorder.start();
  await render(captureFrame);
  captureFrame();
  recorder.stop();
  await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });
  const type = recorder.mimeType || mimeType || 'video/webm';
  const extension = type.includes('mp4') ? 'mp4' : 'webm';
  const href = URL.createObjectURL(new Blob(chunks, { type }));
  download(`tactical-animation-${regionLabel(region)}.${extension}`, href);
  URL.revokeObjectURL(href);
}
