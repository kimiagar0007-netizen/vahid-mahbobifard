import { useEffect } from 'react';

/**
 * Scroll-driven video scrubbing for the hero.
 *
 * The scroll position drives `video.currentTime`; the video never plays (no
 * autoplay, no loop, no `play()`), it is only scrubbed. Scroll events do one
 * cheap thing — record the target progress — and everything else happens inside
 * a requestAnimationFrame loop that stops on its own once it has settled, so an
 * idle page costs nothing and scrolling never re-renders React.
 *
 * Two details keep the scrub smooth:
 *  - the rendered progress eases towards the scroll target (exponential
 *    smoothing) instead of snapping, so small/fast scroll deltas do not show up
 *    as jumps, and
 *  - seeks are quantised to the source frame grid, which turns a continuous
 *    scroll into at most one seek per source frame — the smallest number of
 *    updates a frame-accurate scrub can make.
 */

/** Frame rate of the scrubbing assets; must match the encoded files. */
export const SCRUB_FPS = 24;

/** Smoothing time constant (~ms of lag). Higher = heavier, lower = twitchy. */
const SMOOTHING_TAU = 0.09;
/** Progress gap below which the eased value snaps to the scroll target. */
const SETTLE_EPSILON = 0.001;
/** Ignore currentTime writes smaller than half a source frame. */
const FRAME_EPSILON = 0.5 / SCRUB_FPS;
/** The hero copy/overlay fade completes over this slice of the scroll. */
const TEXT_FADE_END = 0.2;
const TEXT_RISE_PX = 26;

export function useHeroScrub({ trackRef, stageRef, videoRef, contentRef, scrimRef, enabled = true }) {
  useEffect(() => {
    if (!enabled) return undefined;

    const track = trackRef.current;
    const stage = stageRef.current;
    const video = videoRef.current;
    const content = contentRef.current;
    const scrim = scrimRef.current;
    if (!track || !stage || !video) return undefined;

    let target = 0; // scroll progress 0..1
    let current = 0; // eased progress 0..1
    let written = Number.NaN; // last currentTime handed to the video
    let rafId = 0;
    let lastAt = 0;

    const schedule = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    /** 0 at the top of the track, 1 when the sticky stage is about to release. */
    const readProgress = () => {
      const travel = track.offsetHeight - stage.offsetHeight;
      if (travel <= 0) return 0;
      const top = track.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, -top / travel));
    };

    /** Text and scrim follow the eased progress; written straight to the DOM. */
    const paintOverlay = () => {
      const away = Math.min(1, Math.max(0, current / TEXT_FADE_END));
      if (scrim) scrim.style.opacity = String(1 - away);
      if (!content) return;
      content.style.opacity = String(1 - away);
      content.style.transform = away > 0 ? `translate3d(0, ${(-TEXT_RISE_PX * away).toFixed(1)}px, 0)` : '';
      // Keep the faded copy out of the tab order too, not just out of sight.
      content.style.visibility = away >= 0.999 ? 'hidden' : '';
    };

    function tick() {
      rafId = 0;
      const duration = video.duration;
      // Metadata not there yet: 'loadedmetadata' re-arms the loop.
      if (!Number.isFinite(duration) || duration <= 0) return;

      const now = performance.now();
      const dt = lastAt ? Math.min((now - lastAt) / 1000, 0.05) : 0.016;
      lastAt = now;

      current += (target - current) * (1 - Math.exp(-dt / SMOOTHING_TAU));
      if (Math.abs(target - current) < SETTLE_EPSILON) current = target;

      // Snap onto the source frame grid so each frame is seeked at most once.
      const time = Math.min(Math.round(current * duration * SCRUB_FPS) / SCRUB_FPS, duration);
      if (!(Math.abs(time - written) < FRAME_EPSILON)) {
        written = time;
        video.currentTime = time;
      }

      paintOverlay();
      if (current !== target) schedule();
    }

    const onScroll = () => {
      target = readProgress();
      schedule();
    };

    // A fresh load or an orientation change must not skip through the timeline.
    const onReset = () => {
      target = readProgress();
      current = target;
      schedule();
    };

    video.addEventListener('loadedmetadata', onScroll);
    video.addEventListener('durationchange', onScroll);
    video.addEventListener('loadeddata', schedule);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onReset();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', onScroll);
      video.removeEventListener('durationchange', onScroll);
      video.removeEventListener('loadeddata', schedule);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [enabled, trackRef, stageRef, videoRef, contentRef, scrimRef]);
}
