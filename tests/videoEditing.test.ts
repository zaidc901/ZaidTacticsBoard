import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildTimelineSegments, timelineDuration, timelineToSource, sourceToTimeline, snapTimelineTime } from '../src/utils/videoTimeline';
import { makeHistorySnapshot, cloneHistorySnapshot } from '../src/utils/videoHistory';
import { waitForVideoMetadata, seekVideo } from '../src/utils/videoMedia';
import { BOARD_ZOOM_MIN, BOARD_ZOOM_MAX, clampBoardZoom } from '../src/utils/boardZoom';
import type { VideoAnnotation } from '../src/types/video';

const segments = () => buildTimelineSegments(2, 6, [{ id: 'freeze', time: 3, duration: 2 }]);
test('zoom allows close inspection without shrinking below a useful overview', () => {
  assert.equal(clampBoardZoom(.1), BOARD_ZOOM_MIN);
  assert.equal(clampBoardZoom(20), BOARD_ZOOM_MAX);
  assert.equal(clampBoardZoom(2.5), 2.5);
  assert.equal(clampBoardZoom(NaN), 1);
});
test('trimmed video and freeze segments have a continuous output timeline', () => {
  assert.equal(timelineDuration(segments()), 6);
  assert.deepEqual(segments().map(s => [s.kind,s.timelineStart,s.duration]), [['video',0,1],['freeze',1,2],['video',3,3]]);
});
test('seeking inside a freeze holds the correct source frame', () => {
  assert.equal(timelineToSource(segments(), 2.5).sourceTime, 3);
  assert.equal(timelineToSource(segments(), 3.5).sourceTime, 3.5);
  assert.equal(timelineToSource(segments(), 100).sourceTime, 6);
  assert.equal(timelineToSource(segments(), -1).sourceTime, 2);
});
test('source positions and snapping account for inserted freeze duration', () => {
  assert.equal(sourceToTimeline(segments(), 5), 5);
  assert.equal(sourceToTimeline(segments(), 3), 1);
  assert.equal(snapTimelineTime(1.05, segments()), 1);
});
test('freezes outside the trimmed range do not extend the export', () => {
  const result = buildTimelineSegments(2, 6, [{id:'before',time:1,duration:3},{id:'after',time:7,duration:4}]);
  assert.equal(timelineDuration(result), 4);
  assert.equal(result.length, 1);
});
test('history captures trim points and isolates annotation geometry', () => {
  const annotations = [{id:'a',points:[.1,.2,.4,.5],connectionIds:['p1','p2'],keyframes:[{id:'k',time:0,points:[.1,.2]}]}] as VideoAnnotation[];
  const freezes = [{id:'f',time:3,duration:2}];
  const snapshot = makeHistorySnapshot(annotations,freezes,2,6);
  annotations[0].points[0] = .9;
  annotations[0].keyframes[0].points[0] = .9;
  freezes[0].duration = 9;
  const restored = cloneHistorySnapshot(snapshot);
  assert.equal(restored.trimStart,2); assert.equal(restored.trimEnd,6);
  assert.equal(restored.annotations[0].points[0],.1);
  assert.equal(restored.annotations[0].keyframes[0].points[0],.1);
  assert.equal(restored.freezes[0].duration,2);
});
class FakeVideo extends EventTarget {
  readyState=0; duration=8; seeking=false; currentTime=0;
  load() { this.dispatchEvent(new Event('error')); }
}
test('unsupported video metadata fails instead of pretending the clip is ready', async () => {
  await assert.rejects(waitForVideoMetadata(new FakeVideo() as unknown as HTMLVideoElement), /decoded/);
});
test('metadata and seek waits honor export cancellation', async () => {
  const controller = new AbortController();
  const video = new FakeVideo(); video.load = () => {};
  const pending = waitForVideoMetadata(video as unknown as HTMLVideoElement, controller.signal);
  controller.abort();
  await assert.rejects(pending, {name:'AbortError'});
  await assert.rejects(seekVideo(new FakeVideo() as unknown as HTMLVideoElement, 1, controller.signal), {name:'AbortError'});
});
test('an already decoded frame can be exported without waiting for a seek event', async () => {
  const video = new FakeVideo(); video.readyState=4;
  await seekVideo(video as unknown as HTMLVideoElement, 0);
  assert.equal(video.currentTime,0);
});
