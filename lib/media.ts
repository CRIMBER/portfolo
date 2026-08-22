// For a thumbnail-sized <video> with no poster image (no server-side
// transcoding in this environment — see the durationSeconds comment
// on the Media model), Chrome/Firefox/Edge all decode and display the
// frame at this timestamp per the Media Fragments URI spec, purely
// from the fragment identifier — no extra request, no JS. Safari
// ignores it and just shows nothing until playback starts, which is
// no worse than before; every other browser gets a real thumbnail.
export function videoThumbnailUrl(url: string): string {
  return `${url}#t=0.1`;
}
