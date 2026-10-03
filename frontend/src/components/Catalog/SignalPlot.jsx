import PropTypes from 'prop-types'

const C = 200
const R_IN = 26
const R_OUT = 188
const RINGS = [46, 76, 106, 136, 166, 188]
const SPOKES = 24

const point = (angle, r) => [C + Math.cos(angle) * r, C + Math.sin(angle) * r]

/**
 * Polar trace. `values` (0..1) are placed clockwise from 12 o'clock; `marks`
 * emphasise single bins with a numbered spoke. Every figure comes from data
 * the caller computed — there is no decorative signal.
 */
// labelSize is in viewBox units: the SVG scales with its box, so smaller boxes need a larger value.
export function SignalPlot({ values, marks = [], label, scanning = false, compact = false, ghost = false, labelSize = 15, className = '' }) {
  const n = values.length
  const angleOf = (i) => (i / n) * Math.PI * 2 - Math.PI / 2
  const radiusOf = (v) => R_IN + Math.max(0, Math.min(1, v)) * (R_OUT - R_IN - 6)

  const ridge = values
    .map((v, i) => point(angleOf(i), radiusOf(v)))
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ') + ' Z'

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={label} className={className} opacity={ghost ? 0.38 : 1}>
      <title>{label}</title>
      {/* At thumbnail size only the outer ring is drawn; fine grids turn to mush at 64px. */}
      {(compact ? [R_OUT] : RINGS).map(r => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke={compact ? '#4A4A4A' : '#2E2E2E'} strokeWidth={compact ? 4 : 1} />
      ))}
      {!compact && Array.from({ length: SPOKES }, (_, i) => {
        const [x1, y1] = point((i / SPOKES) * Math.PI * 2, R_IN)
        const [x2, y2] = point((i / SPOKES) * Math.PI * 2, R_OUT)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2E2E2E" strokeWidth="1" />
      })}

      <path
        d={ridge}
        fill="#F2F2EC"
        fillOpacity={compact ? 0.25 : 0.07}
        stroke="#F2F2EC"
        strokeWidth={compact ? 7 : 1.25}
        strokeLinejoin="round"
      />

      {marks.map(({ bin, tone, label: text }, index) => {
        const a = angleOf(bin)
        const r = radiusOf(values[bin])
        const [x1, y1] = point(a, R_IN)
        const [x2, y2] = point(a, r)
        // Labels of marks within 3 bins of an earlier one step outward so numbers never overlap.
        const crowded = marks.slice(0, index).filter(m => Math.min(Math.abs(m.bin - bin), n - Math.abs(m.bin - bin)) <= 3).length
        const [tx, ty] = point(a, Math.min(r + 16 + crowded * 22, R_OUT + 14))
        const color = tone === 'fail' ? '#D9261C' : '#F2F2EC'
        return (
          <g key={`${bin}-${text}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={tone === 'fail' ? 2.5 : 1.5} />
            <rect x={x2 - 3} y={y2 - 3} width="6" height="6" fill={color} />
            <text
              x={tx}
              y={ty}
              fill={tone === 'fail' ? '#FF6B60' : '#F2F2EC'}
              fontSize={labelSize}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Geist Mono Variable', monospace"
            >
              {text}
            </text>
          </g>
        )
      })}

      <circle cx={C} cy={C} r={R_IN - 4} fill="#050505" stroke="#F2F2EC" strokeWidth="1" />
      {scanning && (
        <g className="plot-sweep" aria-hidden="true">
          <line x1={C} y1={C - R_IN} x2={C} y2={C - R_OUT} stroke="#D9261C" strokeWidth="2" />
        </g>
      )}
    </svg>
  )
}

SignalPlot.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  marks: PropTypes.arrayOf(PropTypes.shape({
    bin: PropTypes.number.isRequired,
    tone: PropTypes.oneOf(['fail', 'event']),
    label: PropTypes.string,
  })),
  label: PropTypes.string.isRequired,
  scanning: PropTypes.bool,
  compact: PropTypes.bool,
  ghost: PropTypes.bool,
  labelSize: PropTypes.number,
  className: PropTypes.string,
}
