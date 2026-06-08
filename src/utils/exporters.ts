import Konva from 'konva';
import { Project } from '../types/domain';

export function download(filename: string, href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function exportStageImage(stage: Konva.Stage, type: 'png' | 'jpeg' = 'png') {
  const uri = stage.toDataURL({ mimeType: `image/${type}`, pixelRatio: 2 });
  download(`tactical-board.${type === 'jpeg' ? 'jpg' : 'png'}`, uri);
}

export function exportProject(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  download(`${project.name.replace(/\s+/g, '-').toLowerCase()}.json`, URL.createObjectURL(blob));
}

export async function recordCanvas(canvas: HTMLCanvasElement, seconds = 4, fps = 30) {
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => chunks.push(event.data);
  recorder.start();
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  recorder.stop();
  await new Promise((resolve) => { recorder.onstop = resolve; });
  download('tactical-animation.webm', URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
}
