const parseBooleanFlag = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
};

export const isTranscriptCompareEnabled = parseBooleanFlag(
  import.meta.env.VITE_ENABLE_TRANSCRIPT_COMPARE
);
