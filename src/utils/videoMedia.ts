import type { TimelineSegment } from '../types/video';

const checkAbort = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('Export cancelled', 'AbortError');
};

function mediaReady(video: HTMLVideoElement, event: 'loadedmetadata' | 'seeked', ready: () => boolean, action: () => void, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    checkAbort(signal);
    let timer: ReturnType<typeof setTimeout>;
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener(event, done);
      video.removeEventListener('loadeddata', done);
      video.removeEventListener('error', fail);
      signal?.removeEventListener('abort', abort);
    };
    const done = () => { if (ready()) { cleanup(); resolve(); } };
    const fail = () => { cleanup(); reject(new Error('The video could not be decoded. Try an H.264 MP4 file.')); };
    const abort = () => { cleanup(); reject(new DOMException('Export cancelled', 'AbortError')); };
    video.addEventListener(event, done);
    video.addEventListener('loadeddata', done);
    video.addEventListener('error', fail);
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => { cleanup(); reject(new Error('The video took too long to load or seek. Try again with a supported video.')); }, 10000);
    try { action(); done(); } catch (error) { cleanup(); reject(error); }
  });
}

export function waitForVideoMetadata(video: HTMLVideoElement, signal?: AbortSignal) {
  return mediaReady(video, 'loadedmetadata', () => video.readyState >= 1 && Number.isFinite(video.duration), () => { if (video.readyState < 1) video.load(); }, signal);
}

export function seekVideo(video: HTMLVideoElement, time: number, signal?: AbortSignal) {
  const target = Math.max(0, Math.min(Number.isFinite(video.duration) ? video.duration : time, time));
  return mediaReady(video, 'seeked', () => !video.seeking && video.readyState >= 2 && Math.abs(video.currentTime - target) < .08, () => {
    if (Math.abs(video.currentTime - target) > .001 || video.readyState < 2) video.currentTime = target;
  }, signal);
}

export function recordingMimeType() {
  if (typeof MediaRecorder === 'undefined') throw new Error('Video recording is not supported in this browser. You can still export a PNG.');
  return ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type)) ?? '';
}

/** Record continuous source playback, pausing recording only while seeking between segments. */
export async function recordVideoComposition(options: {
  url: string; width: number; height: number; segments: TimelineSegment[]; rate: number; audio: boolean;
  previewElement?: HTMLVideoElement;
  signal: AbortSignal; onProgress: (progress: number) => void;
  drawOverlay: (ctx: CanvasRenderingContext2D, time: number, width: number, height: number) => void;
}) {
  const { signal, segments, width, height } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The video export canvas is unavailable.');

  const video = document.createElement('video');
  video.src = options.url;
  video.playsInline = true;
  video.preload = 'auto';
  // Keep the exporting decoder in the visible preview: some browsers suspend
  // presented frames for off-screen video even though its clock keeps advancing.
  const preview = options.previewElement;
  const originalOpacity = preview?.style.opacity;
  if (preview?.parentElement) {
    Object.assign(video.style, { position: 'absolute', width: '100%', height: '100%', top: '0', left: '0', pointerEvents: 'none', zIndex: '0' });
    preview.parentElement.insertBefore(video, preview);
    preview.style.opacity = '0';
  } else {
    Object.assign(video.style, { position: 'fixed', width: '320px', height: '180px', bottom: '0', right: '0', pointerEvents: 'none' });
    document.body.appendChild(video);
  }
  const decodedFrame = document.createElement('canvas');
  decodedFrame.width = width; decodedFrame.height = height;
  const decodedContext = decodedFrame.getContext('2d');
  let presentedTime = -Infinity;
  let lastPresentedAt = performance.now();
  let frameCallback: number | undefined;
  const capturePresentedFrame: VideoFrameRequestCallback = (_now, metadata) => {
    decodedContext?.drawImage(video, 0, 0, width, height);
    presentedTime = metadata.mediaTime;
    lastPresentedAt = performance.now();
    frameCallback = video.requestVideoFrameCallback(capturePresentedFrame);
  };
  if (typeof video.requestVideoFrameCallback === 'function') frameCallback = video.requestVideoFrameCallback(capturePresentedFrame);
  const waitForPresentedFrame = async (target: number) => {
    if (frameCallback === undefined) { await new Promise(resolve => setTimeout(resolve, 34)); checkAbort(signal); return; }
    const started = performance.now();
    while (Math.abs(presentedTime - target) > .08) {
      checkAbort(signal);
      if (performance.now() - started > 2500) throw new Error('The browser did not present the requested video frame. Please retry the export.');
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  };
  let stream: MediaStream | undefined;
  let audioContext: AudioContext | undefined;
  let recorder: MediaRecorder | undefined;
  let stopped: Promise<void> | undefined;
  let recordingError: Error | undefined;
  const chunks: BlobPart[] = [];
  const rate = Math.max(.25, Math.min(2, options.rate || 1));
  const total = segments.reduce((sum, segment) => sum + segment.duration, 0);
  const draw = (time: number) => {
    context.drawImage(frameCallback !== undefined && Number.isFinite(presentedTime) ? decodedFrame : video, 0, 0, width, height);
    options.drawOverlay(context, time, width, height);
    options.onProgress(Math.min(1, time / Math.max(.01, total)));
  };
  try {
    checkAbort(signal);
    const mimeType = recordingMimeType();
    await waitForVideoMetadata(video, signal);
    stream = canvas.captureStream(30);
    if (options.audio) {
      if (typeof AudioContext === 'undefined') throw new Error('Source audio export is unavailable in this browser. Turn off Include source audio to export a silent video.');
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(video);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination); // Export audio without sending it to the speakers.
      destination.stream.getAudioTracks().forEach(track => stream!.addTrack(track));
      await audioContext.resume();
    } else video.muted = true;
    recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: Math.max(4_000_000, width * height * 8) });
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    stopped = new Promise(resolve => {
      recorder!.onstop = () => resolve();
      recorder!.onerror = () => { recordingError = new Error('Video recording failed. Try a shorter clip or a different browser.'); resolve(); };
    });
    for (const segment of segments) {
      checkAbort(signal);
      video.pause();
      if (recorder.state === 'recording') recorder.pause();
      await seekVideo(video, segment.sourceStart, signal);
      await waitForPresentedFrame(segment.sourceStart);
      video.playbackRate = rate;
      draw(segment.timelineStart);
      if (segment.kind === 'video') await video.play();
      const startedAt = performance.now();
      let lastSourceTime = video.currentTime;
      let lastProgressAt = startedAt;
      if (recorder.state === 'inactive') recorder.start(100);
      else if (recorder.state === 'paused') recorder.resume();
      while (true) {
        checkAbort(signal);
        if (recordingError) throw recordingError;
        const now = performance.now();
        if (document.hidden || (segment.kind === 'video' && frameCallback !== undefined && now - lastPresentedAt > 500 && video.currentTime - presentedTime > .25)) throw new Error('Keep the video editor visible while exporting, then try again.');
        const elapsed = segment.kind === 'freeze'
          ? (now - startedAt) / 1000 * rate
          : Math.max(0, video.currentTime - segment.sourceStart);
        const timelineTime = segment.timelineStart + Math.min(segment.duration, elapsed);
        draw(timelineTime);
        if (elapsed >= segment.duration - 1 / 60 || (segment.kind === 'video' && video.ended)) break;
        if (segment.kind === 'video') {
          if (video.currentTime > lastSourceTime + .001) { lastSourceTime = video.currentTime; lastProgressAt = now; }
          if (now - lastProgressAt > 4000) throw new Error('Video playback stalled during export. Please try again.');
        }
        await new Promise(resolve => setTimeout(resolve, 1000 / 30));
      }
    }
    video.pause();
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;
    if (recordingError) throw recordingError;
    checkAbort(signal);
    if (!chunks.length) throw new Error('The browser produced an empty video. Please try again.');
    options.onProgress(1);
    return new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' });
  } finally {
    video.pause();
    if (recorder && recorder.state !== 'inactive') { recorder.stop(); await stopped; }
    stream?.getTracks().forEach(track => track.stop());
    if (audioContext && audioContext.state !== 'closed') await audioContext.close();
    if (frameCallback !== undefined) video.cancelVideoFrameCallback(frameCallback);
    video.removeAttribute('src'); video.load(); video.remove();
    if (preview) preview.style.opacity = originalOpacity ?? '';
  }
}
