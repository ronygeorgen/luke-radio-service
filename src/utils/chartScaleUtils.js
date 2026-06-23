/**
 * Build a Y-axis scale with a small number of evenly spaced "nice" tick values.
 * Avoids cramming dozens of labels when data max is large.
 */
export const computeNiceYAxisScale = (maxValue, targetTickCount = 5) => {
  const safeMax = Math.max(maxValue, 1);
  const rawStep = safeMax / targetTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;

  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 2.5) niceNormalized = 2.5;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;

  let step = niceNormalized * magnitude;
  let roundedMax = Math.ceil(safeMax / step) * step;

  const buildTicks = (tickStep, axisMax) => {
    const ticks = [];
    for (let v = 0; v <= axisMax + tickStep * 0.001; v += tickStep) {
      ticks.push(Math.round(v));
    }
    return ticks;
  };

  let yAxisValues = buildTicks(step, roundedMax);

  // Safety net: never show more than 7 tick labels
  while (yAxisValues.length > 7) {
    step *= 2;
    roundedMax = Math.ceil(safeMax / step) * step;
    yAxisValues = buildTicks(step, roundedMax);
  }

  return { roundedMax, yAxisValues, step };
};

/** Axis label — full integer (e.g. 1500, not "1.5k"). */
export const formatChartAxisValue = (value) => String(Math.round(value));
