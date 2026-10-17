type PointerSample = Pick<PointerEvent, 'pointerId' | 'clientX' | 'clientY'>;

/** Track a whole gesture independently of canvas/React pointer capture. */
export function trackBoardPointer(target: EventTarget, pointerId: number, handlers: {
  move: (event: PointerSample) => void;
  release: (event: PointerSample) => void;
  interrupt: () => void;
}) {
  let active = true;
  const matches = (event: Event) => active && (event as PointerEvent).pointerId === pointerId;
  const move = (event: Event) => { if (matches(event)) handlers.move(event as PointerEvent); };
  const release = (event: Event) => {
    if (!matches(event)) return;
    stop();
    handlers.release(event as PointerEvent);
  };
  const interrupt = (event: Event) => {
    if (!active || (event.type !== 'blur' && !matches(event))) return;
    stop();
    handlers.interrupt();
  };
  function stop() {
    active = false;
    target.removeEventListener('pointermove', move, true);
    target.removeEventListener('pointerup', release, true);
    target.removeEventListener('pointercancel', interrupt, true);
    target.removeEventListener('blur', interrupt, true);
  }
  target.addEventListener('pointermove', move, true);
  target.addEventListener('pointerup', release, true);
  target.addEventListener('pointercancel', interrupt, true);
  target.addEventListener('blur', interrupt, true);
  return stop;
}
