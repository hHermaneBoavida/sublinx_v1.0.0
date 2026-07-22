/**
 * Client-side video compression using canvas + MediaRecorder.
 * Reduces resolution and bitrate for faster loading (TikTok-style).
 * Falls back to original file if compression is unsupported or fails.
 */

export async function compressVideo(file, opts = {}) {
  const {
    maxWidth = 720,
    videoBitsPerSecond = 1_500_000,
    mimeType = 'video/webm;codecs=vp9',
  } = opts;

  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
    return file;
  }

  const supportedMime = MediaRecorder.isTypeSupported(mimeType)
    ? mimeType
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
      ? 'video/webm;codecs=vp8'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : null;

  if (!supportedMime) return file;

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    let recorder = null;
    let stream = null;
    let cleanupTimer = null;
    const cleanup = () => {
      URL.revokeObjectURL(url);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };

    const fail = () => { cleanup(); resolve(file); };

    video.onloadedmetadata = () => {
      const aspect = video.videoHeight / video.videoWidth;
      const width = Math.min(maxWidth, video.videoWidth);
      const height = Math.round(width * aspect);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      stream = canvas.captureStream(30);
      try {
        recorder = new MediaRecorder(stream, {
          mimeType: supportedMime,
          videoBitsPerSecond,
        });
      } catch {
        fail();
        return;
      }

      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        cleanup();
        const blob = new Blob(chunks, { type: supportedMime });
        if (blob.size < file.size * 0.85) {
          const compressed = new File([blob], file.name.replace(/\.(mp4|mov)$/i, '.webm'), { type: supportedMime });
          resolve(compressed);
        } else {
          resolve(file);
        }
      };

      recorder.onerror = fail;

      cleanupTimer = setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      }, 30000);

      const drawFrame = () => {
        if (video.paused || video.ended || !recorder || recorder.state !== 'recording') return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };
      video.onplay = () => requestAnimationFrame(drawFrame);
      video.onended = () => {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
      };
      video.onerror = fail;

      recorder.start();
      video.play().catch(fail);
    };

    video.onerror = fail;
  });
}