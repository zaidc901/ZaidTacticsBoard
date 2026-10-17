import type { FreezeSegment, TimelineSegment } from '../types/video';
const clampRange = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function buildTimelineSegments(trimStart: number, trimEnd: number, freezes: FreezeSegment[]): TimelineSegment[] {
  const start = Math.max(0, trimStart);
  const end = Math.max(start + 0.2, trimEnd);
  const activeFreezes = freezes
    .filter(freeze => freeze.time >= start && freeze.time <= end)
    .sort((a, b) => a.time - b.time);
  const segments: TimelineSegment[] = [];
  let sourceCursor = start;
  let timelineCursor = 0;

  activeFreezes.forEach((freeze, index) => {
    if (freeze.time > sourceCursor + 0.01) {
      const duration = freeze.time - sourceCursor;
      segments.push({
        id: `video-${index}-${sourceCursor}`,
        kind: 'video',
        label: 'Video',
        sourceStart: sourceCursor,
        sourceEnd: freeze.time,
        duration,
        timelineStart: timelineCursor,
      });
      timelineCursor += duration;
    }
    const duration = clampRange(freeze.duration, 0.5, 10);
    segments.push({
      id: freeze.id,
      kind: 'freeze',
      label: 'Freeze image',
      sourceStart: freeze.time,
      sourceEnd: freeze.time,
      duration,
      timelineStart: timelineCursor,
      freezeId: freeze.id,
    });
    timelineCursor += duration;
    sourceCursor = freeze.time;
  });

  if (end > sourceCursor + 0.01) {
    const duration = end - sourceCursor;
    segments.push({
      id: `video-tail-${sourceCursor}`,
      kind: 'video',
      label: 'Video',
      sourceStart: sourceCursor,
      sourceEnd: end,
      duration,
      timelineStart: timelineCursor,
    });
  }
  return segments;
}

export function timelineDuration(segments: TimelineSegment[]) {
  const last = segments.at(-1);
  return last ? last.timelineStart + last.duration : 0;
}

export function timelineSnapPoints(segments: TimelineSegment[]) {
  const total = timelineDuration(segments);
  const points = [0, total];
  segments.forEach(segment => {
    points.push(segment.timelineStart);
    points.push(segment.timelineStart + segment.duration);
  });
  return Array.from(new Set(points.map(point => Number(point.toFixed(3))))).sort((a, b) => a - b);
}

export function nearestTimelineSnap(time: number, segments: TimelineSegment[], threshold = 0.12) {
  const snap = timelineSnapPoints(segments).find(point => Math.abs(point - time) <= threshold);
  return snap ?? time;
}

export function closestTimelineSnap(time: number, segments: TimelineSegment[]) {
  const points = timelineSnapPoints(segments);
  return points.reduce((closest, point) => Math.abs(point - time) < Math.abs(closest - time) ? point : closest, points[0] ?? 0);
}

export function snapTimelineTime(time: number, segments: TimelineSegment[], threshold = 0.12) {
  const total = Math.max(0, timelineDuration(segments));
  const safe = clampRange(time, 0, total);
  return clampRange(nearestTimelineSnap(safe, segments, threshold), 0, total);
}

export function timelineToSource(segments: TimelineSegment[], timelineTime: number) {
  const total = timelineDuration(segments);
  const safe = clampRange(timelineTime, 0, Math.max(0, total));
  const segment = segments.find((item, index) => {
    const start = item.timelineStart;
    const end = item.timelineStart + item.duration;
    return safe >= start && (safe < end || (index === segments.length - 1 && safe <= end));
  }) ?? segments.at(-1);
  if (!segment) return { sourceTime: 0, segment: undefined as TimelineSegment | undefined, timelineTime: safe };
  if (segment.kind === 'freeze') return { sourceTime: segment.sourceStart, segment, timelineTime: safe };
  return {
    sourceTime: clampRange(segment.sourceStart + (safe - segment.timelineStart), segment.sourceStart, segment.sourceEnd),
    segment,
    timelineTime: safe,
  };
}

export function sourceToTimeline(segments: TimelineSegment[], sourceTime: number) {
  if (!segments.length) return 0;
  const freezeMatch = segments.find(segment => segment.kind === 'freeze' && Math.abs(sourceTime - segment.sourceStart) <= 0.02);
  if (freezeMatch) return freezeMatch.timelineStart;
  let fallback = 0;
  for (const segment of segments) {
    if (segment.kind === 'video' && sourceTime >= segment.sourceStart && sourceTime <= segment.sourceEnd) {
      return segment.timelineStart + (sourceTime - segment.sourceStart);
    }
    if (sourceTime >= segment.sourceStart) fallback = segment.timelineStart + segment.duration;
  }
  return clampRange(fallback, 0, timelineDuration(segments));
}

