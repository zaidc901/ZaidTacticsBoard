import type { VideoAnnotation, FreezeSegment, HistorySnapshot } from '../types/video';

function cloneAnnotation(annotation: VideoAnnotation): VideoAnnotation {
  return {
    ...annotation,
    points: annotation.points.slice(),
    connectionIds: annotation.connectionIds?.slice(),
    keyframes: annotation.keyframes.map(keyframe => ({ ...keyframe, points: keyframe.points.slice() })),
  };
}

export function cloneHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    trimStart: snapshot.trimStart,
    trimEnd: snapshot.trimEnd,
    annotations: snapshot.annotations.map(cloneAnnotation),
    freezes: snapshot.freezes.map(freeze => ({ ...freeze })),
  };
}

export function makeHistorySnapshot(annotations: VideoAnnotation[], freezes: FreezeSegment[], trimStart: number, trimEnd: number): HistorySnapshot {
  return cloneHistorySnapshot({ annotations, freezes, trimStart, trimEnd });
}

