import React, { useState } from 'react';
import { Play, Code2, ExternalLink } from 'lucide-react';

/**
 * Parses any media URL into a normalized format.
 * Supports:
 *  - YouTube (regular, unlisted, shorts, embed)
 *  - Google Drive video links (direct stream or preview)
 *  - Direct HTML5 videos (.mp4, .webm, .mov)
 *  - Standard images
 */
export function parseMediaUrl(url, declaredType = '') {
  if (!url) return { type: 'none' };

  // 1. YouTube Match
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      type: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0&showinfo=0`,
      interactiveUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&controls=1&rel=0`
    };
  }

  // 2. Google Drive Video Match
  const gDriveMatch = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    const id = gDriveMatch[1];
    return {
      type: 'gdrive',
      id,
      directUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      streamUrl: `https://drive.usercontent.google.com/download?id=${id}&export=download`,
      embedUrl: `https://drive.google.com/file/d/${id}/preview`
    };
  }

  // 3. Direct Video (.mp4, .webm, .mov or declared as video)
  if (declaredType === 'video' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return {
      type: 'video',
      url
    };
  }

  // 4. Default: Image
  return {
    type: 'image',
    url
  };
}

export default function ProjectMedia({
  url,
  type = '',
  title = 'Project Preview',
  isWallpaper = false,
  interactive = false,
  aspectRatio = '56.25%', // 16:9
  className = '',
  style = {}
}) {
  const [hasError, setHasError] = useState(false);
  const [gdriveStreamFailed, setGdriveStreamFailed] = useState(false);
  const media = parseMediaUrl(url, type);

  // When aspectRatio is 'none' or parent supplies fluid height, do not add padding-top
  const isFluid =
    aspectRatio === 'none' ||
    aspectRatio === '0%' ||
    style.height === '100%' ||
    style.position === 'absolute' ||
    Boolean(style.inset);

  if (!url || hasError || media.type === 'none') {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isFluid ? '100%' : 'auto',
          paddingTop: isFluid ? 0 : aspectRatio,
          backgroundColor: 'var(--bg-tertiary)',
          ...style
        }}
        className={className}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-muted)'
          }}
        >
          <Code2 size={36} opacity={0.4} />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>No preview available</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: isFluid ? '100%' : 'auto',
        paddingTop: isFluid ? 0 : aspectRatio,
        overflow: 'hidden',
        backgroundColor: '#000000',
        ...style
      }}
      className={className}
    >
      {/* ── YouTube Video (Wallpaper or Interactive) ── */}
      {media.type === 'youtube' && (
        <iframe
          src={interactive ? media.interactiveUrl : media.embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          onError={() => setHasError(true)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: isWallpaper ? '130%' : '100%',
            height: isWallpaper ? '130%' : '100%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            backgroundColor: '#000000',
            pointerEvents: isWallpaper ? 'none' : 'auto'
          }}
        />
      )}

      {/* ── Google Drive Video Stream ── */}
      {media.type === 'gdrive' && !gdriveStreamFailed && (
        <video
          key={media.id}
          src={media.directUrl}
          autoPlay
          muted
          loop
          playsInline
          controls={interactive}
          onError={() => setGdriveStreamFailed(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isWallpaper ? 'cover' : 'contain',
            backgroundColor: '#000000'
          }}
        />
      )}

      {/* Fallback to Drive Preview Iframe if direct stream blocked */}
      {media.type === 'gdrive' && gdriveStreamFailed && (
        <iframe
          src={media.embedUrl}
          title={title}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000000'
          }}
        />
      )}

      {/* ── Direct HTML5 Video (.mp4 / .webm) ── */}
      {media.type === 'video' && (
        <video
          src={media.url}
          autoPlay
          muted
          loop
          playsInline
          controls={interactive}
          onError={() => setHasError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isWallpaper ? 'cover' : 'contain',
            backgroundColor: '#000000'
          }}
        />
      )}

      {/* ── High-Res Image / Screenshot ── */}
      {media.type === 'image' && (
        <img
          src={media.url}
          alt={title}
          onError={() => setHasError(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: isWallpaper ? 'cover' : 'contain',
            backgroundColor: '#000000'
          }}
        />
      )}
    </div>
  );
}
