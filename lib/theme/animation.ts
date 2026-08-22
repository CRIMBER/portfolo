import type { AnimationConfig, AnimationIntensity, AnimationPreset, AnimationTarget } from "./schema";

// How much "weight" each intensity level carries — consumed by the
// preset components below to scale duration/distance, so a member
// picking "calm" vs "extreme" for the same preset actually feels
// different rather than just changing a label.
const INTENSITY_SCALE: Record<AnimationIntensity, number> = {
  calm: 0.6,
  smooth: 1,
  dynamic: 1.5,
  extreme: 2.2,
};

export function findPreset(animation: AnimationConfig, target: AnimationTarget): AnimationPreset | undefined {
  return animation.presets.find((preset) => preset.target === target);
}

export function intensityScale(intensity: AnimationIntensity): number {
  return INTENSITY_SCALE[intensity];
}
