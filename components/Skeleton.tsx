interface SkeletonBlockProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}

// A single shimmering placeholder rect — compose several into the
// rough shape of whatever page is loading (see the loading.tsx files
// under app/dashboard, app/directory, app/admin).
export function SkeletonBlock({ width = "100%", height = 16, radius = "var(--radius-sm)" }: SkeletonBlockProps) {
  return <div className="skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius, flexShrink: 0 }} />;
}
