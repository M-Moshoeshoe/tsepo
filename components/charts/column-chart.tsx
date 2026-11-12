/**
 * Compact stacked columns drawn on the server as plain SVG: no chart library
 * and no client JavaScript. Hovering or focusing a day shows its value; the
 * legend repeats each series total; a visually hidden table gives screen
 * readers every number. Colours are theme tokens; text uses text tokens.
 */

export interface ChartSeries {
  key: string;
  label: string;
  /** A theme fill class for the marks, such as fill-utility-green-600. */
  fill: string;
  /** The same colour as a background class, for the legend swatch. */
  swatch: string;
}

export interface ChartColumn {
  key: string;
  /** The short axis label, such as "12 Nov". */
  label: string;
  /** The full label for the tooltip and the table, such as "12 November 2026". */
  full: string;
  /** One value per series, in series order. */
  values: number[];
}

/** About 140px tall at a typical content width: wide view box, short plot. */
const WIDTH = 960;
const VALUE_ROOM = 18;
const PLOT_HEIGHT = 96;
const AXIS_HEIGHT = 22;
const LEFT = 4;
const RIGHT = 4;
const GAP = 2;
const RADIUS = 3;
const MAX_BAR = 14;

/** A round top for the scale: 1, 2 or 5 times a power of ten, at least the data. */
function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((factor) => factor * power >= value) ?? 10;
  return step * power;
}

/** A column segment with only its top corners rounded, anchored to the baseline. */
function topRounded(x: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, width / 2, height);
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

function format(value: number, unit: string): string {
  const text = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
  return unit === '' ? text : `${text} ${unit}`;
}

export function ColumnChart({
  id,
  title,
  description,
  series,
  columns,
  unit,
  totals,
  limit,
  note,
}: {
  id: string;
  title: string;
  description: string;
  series: ChartSeries[];
  columns: ChartColumn[];
  /** The unit for values in tooltips and the table, such as "RLUSD", or "" for counts. */
  unit: string;
  /** One total per series, shown in the legend. They must equal the matching list counts. */
  totals?: number[];
  /** A thin dashed reference line, such as the daily limit. */
  limit?: { value: number; label: string };
  /** A short line under the chart, for example when only part of a range is drawn. */
  note?: string;
}) {
  const stacks = columns.map((column) => column.values.reduce((sum, value) => sum + value, 0));
  const top = niceCeiling(Math.max(...stacks, limit === undefined ? 0 : limit.value * 1.15));
  const plotWidth = WIDTH - LEFT - RIGHT;
  const slot = plotWidth / Math.max(columns.length, 1);
  const barWidth = Math.max(3, Math.min(MAX_BAR, slot * 0.5));
  const scale = (value: number): number => (value / top) * PLOT_HEIGHT;
  const baseline = VALUE_ROOM + PLOT_HEIGHT;
  const labelEvery = Math.ceil(columns.length / 7);
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <figure className="grid gap-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <span className="flex items-baseline gap-2">
          <span id={titleId} className="text-sm font-semibold text-primary">
            {title}
          </span>
          <span className="text-xs text-quaternary tabular-nums">Scale to {format(top, unit)}</span>
        </span>
        {series.length >= 2 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary" aria-label="Legend">
            {series.map((item, index) => (
              <li key={item.key} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-sm ${item.swatch}`} aria-hidden />
                {item.label}
                {totals !== undefined && <span className="font-semibold text-primary tabular-nums">{totals[index] ?? 0}</span>}
              </li>
            ))}
          </ul>
        )}
      </figcaption>

      <svg viewBox={`0 0 ${String(WIDTH)} ${String(baseline + AXIS_HEIGHT)}`} className="h-auto max-h-36 w-full" role="img" aria-labelledby={`${titleId} ${descId}`}>
        <desc id={descId}>{description}</desc>
        <line x1={LEFT} x2={WIDTH - RIGHT} y1={baseline} y2={baseline} className="stroke-border-secondary" strokeWidth={1} />

        {limit !== undefined && (
          <g aria-hidden>
            <line
              x1={LEFT}
              x2={WIDTH - RIGHT}
              y1={baseline - scale(limit.value)}
              y2={baseline - scale(limit.value)}
              className="stroke-fg-quaternary"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text x={LEFT} y={baseline - scale(limit.value) - 4} className="fill-text-tertiary text-[10px]">
              {limit.label}
            </text>
          </g>
        )}

        {columns.map((column, index) => {
          const x = LEFT + index * slot + (slot - barWidth) / 2;
          const total = stacks[index] ?? 0;
          let y = baseline;
          const lastShown = column.values.reduce((last, value, position) => (value > 0 ? position : last), -1);
          const tooltip = `${column.full}: ${series.map((item, position) => `${format(column.values[position] ?? 0, unit)} ${item.label.toLowerCase()}`).join(', ')}`;
          return (
            <g
              key={column.key}
              className="group outline-none"
              // Days with values can be reached with the keyboard; focusing one shows its value, like hovering.
              tabIndex={total > 0 ? 0 : undefined}
              aria-label={total > 0 ? tooltip : undefined}
            >
              <title>{tooltip}</title>
              {/* A hit area wider and taller than the marks, so the value is easy to reach. */}
              <rect x={LEFT + index * slot} y={0} width={slot} height={baseline} className="fill-transparent" />
              <rect
                x={LEFT + index * slot + 1}
                y={1}
                width={slot - 2}
                height={baseline - 1}
                rx={4}
                className="fill-none stroke-focus-ring opacity-0 group-focus-visible:opacity-100"
                strokeWidth={2}
              />
              {column.values.map((value, position) => {
                if (value <= 0) return null;
                const height = scale(value);
                y -= height;
                const seriesItem = series[position];
                const drawn = Math.max(height - (position === 0 ? 0 : GAP), 1);
                return position === lastShown ? (
                  <path key={seriesItem?.key ?? position} d={topRounded(x, y, barWidth, drawn)} className={seriesItem?.fill} />
                ) : (
                  <rect key={seriesItem?.key ?? position} x={x} y={y} width={barWidth} height={drawn} className={seriesItem?.fill} />
                );
              })}
              {total > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={Math.max(baseline - scale(total) - 5, 11)}
                  textAnchor="middle"
                  className="fill-text-primary text-[11px] font-semibold opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                >
                  {format(total, unit)}
                </text>
              )}
              {index % labelEvery === 0 && (
                <text x={x + barWidth / 2} y={baseline + 15} textAnchor="middle" className="fill-text-quaternary text-[10px]">
                  {column.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {note !== undefined && <p className="text-xs text-tertiary">{note}</p>}

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {series.map((item) => (
              <th key={item.key} scope="col">
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((column) => (
            <tr key={column.key}>
              <th scope="row">{column.full}</th>
              {series.map((item, position) => (
                <td key={item.key}>{format(column.values[position] ?? 0, unit)}</td>
              ))}
            </tr>
          ))}
          {totals !== undefined && (
            <tr>
              <th scope="row">Total</th>
              {series.map((item, position) => (
                <td key={item.key}>{format(totals[position] ?? 0, unit)}</td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </figure>
  );
}
