import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { Icon } from '../ui/Icons.jsx';
import { useHeroScrub } from './useHeroScrub.js';

function withHighlight(title = '', phrase = '') {
  if (!phrase || !title.includes(phrase)) return title;
  const index = title.indexOf(phrase);
  return (
    <>
      {title.slice(0, index)}
      <em>{phrase}</em>
      {title.slice(index + phrase.length)}
    </>
  );
}

const FACTS = [
  { icon: 'box', text: 'تأمین پانل، پروفیل و تجهیزات کناف' },
  { icon: 'tools', text: 'اجرای سقف کاذب و دیوار خشک' },
  { icon: 'clipboardCheck', text: 'استعلام آنلاین اجرای پروژه' },
];

/*
 * Scroll-scrubbed hero video
 * --------------------------
 * The scroll position — not playback — drives the video timeline, in both
 * directions, and the video stays paused at all times. The engine lives in
 * useHeroScrub.js; this file only owns the markup and the asset choice.
 *
 * Encoding matters more than anything else here: seeking a long-GOP file makes
 * the browser decode forward from the previous keyframe on every seek, which is
 * exactly what stutters. Both sources below are therefore re-encoded all-intra
 * (every frame a keyframe), audio stripped, faststart for progressive loading:
 *
 *   ffmpeg -i source.mp4 -an -c:v libx264 -crf 21 -preset medium \
 *     -g 1 -keyint_min 1 -sc_threshold 0 -pix_fmt yuv420p -profile:v high \
 *     -movflags +faststart hero-scrub.mp4
 *   # mobile: same, with -vf "scale=854:-2" -crf 24
 *   ffmpeg -i source.mp4 -frames:v 1 -vf "scale=1184:-2" -c:v libwebp \
 *     -quality 80 hero-poster.webp        # frame 0, shown before the video is live
 *
 * Preferred characteristics if the clip is ever replaced: H.264 MP4 (universal,
 * hardware-decoded), yuv420p, 24-30fps, modest resolution (<=1280px wide) and a
 * few Mbit/s, keyframes at least every ~0.5s — all-intra when the clip is short
 * enough to afford it. A WebM/VP9 alternative is only worth it when the source
 * is already VP9; ordering it first makes Safari fall back anyway.
 */
const VIDEO_DESKTOP = '/videos/hero-scrub.mp4';
const VIDEO_MOBILE = '/videos/hero-scrub-mobile.mp4';
const VIDEO_POSTER = '/videos/hero-poster.webp';
const MOBILE_MEDIA = '(max-width: 700px)';
const HERO_IMAGE_FALLBACK = '/images/sections/hero-ceiling-linear.svg';

export default function Hero() {
  const { home, brand } = useSettings();

  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const contentRef = useRef(null);
  const scrimRef = useRef(null);

  // Read synchronously so the first paint already has the right layout.
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [videoReady, setVideoReady] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);

  const scrubbing = !reducedMotion && !mediaFailed;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // One source only, chosen before the element starts loading: phones get the
  // smaller encode, everything else the full one.
  useEffect(() => {
    const video = videoRef.current;
    if (!scrubbing || !video || video.getAttribute('src')) return;
    video.setAttribute('src', window.matchMedia(MOBILE_MEDIA).matches ? VIDEO_MOBILE : VIDEO_DESKTOP);
  }, [scrubbing]);

  useHeroScrub({ trackRef, stageRef, videoRef, contentRef, scrimRef, enabled: scrubbing });

  const hero = (
    <section className={`hero${scrubbing ? ' hero--scrub' : ''}`}>
      <div className="hero__media">
        {/* Last-resort visual: the hero image this section shipped with. */}
        <img src={home.hero_image || HERO_IMAGE_FALLBACK} alt={home.hero_image_alt || 'سقف کاذب کناف'} />
        {/* Frame 0 of the video, on top of it: the hero looks like the first frame
            of the scene even before a single byte of video has been decoded. */}
        {!mediaFailed ? (
          <img
            className="hero__poster"
            src={VIDEO_POSTER}
            alt=""
            aria-hidden="true"
            onError={() => setMediaFailed(true)}
          />
        ) : null}
        {scrubbing ? (
          <video
            ref={videoRef}
            className={`hero__video${videoReady ? ' is-ready' : ''}`}
            poster={VIDEO_POSTER}
            preload="auto"
            muted
            playsInline
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setMediaFailed(true)}
          />
        ) : null}
      </div>
      <div className="hero__scrim" ref={scrimRef} aria-hidden="true" />
      <div className="hero__inner" ref={contentRef}>
        <div className="container">
          <div className="hero__content reveal">
            <span className="hero__eyebrow">
              <Icon name="sparkle" size={16} />
              {brand.tagline}
            </span>
            <h1 className="hero__title">{withHighlight(home.hero_title, home.hero_highlight)}</h1>
            <p className="hero__subtitle">{home.hero_subtitle}</p>
            <div className="hero__actions">
              <ButtonLink to="/shop" variant="primary" size="lg">
                <Icon name="cart" size={18} />
                مشاهده محصولات
              </ButtonLink>
              <ButtonLink to="/project-inquiry" variant="secondary" size="lg">
                <Icon name="clipboardCheck" size={18} />
                ثبت درخواست اجرای پروژه
              </ButtonLink>
            </div>
            <div className="hero__facts">
              {FACTS.map((fact) => (
                <span className="hero__fact" key={fact.text}>
                  <Icon name={fact.icon} size={20} />
                  {fact.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {scrubbing ? (
        <div className={`hero__loader${videoReady ? ' is-done' : ''}`} aria-hidden="true">
          <span className="hero__loader-bar" />
          <span className="hero__loader-text">در حال آماده‌سازی صحنه…</span>
        </div>
      ) : null}
    </section>
  );

  if (!scrubbing) return hero;

  return (
    <div className="hero-track" ref={trackRef}>
      <div className="hero-stage" ref={stageRef}>
        {hero}
      </div>
    </div>
  );
}
