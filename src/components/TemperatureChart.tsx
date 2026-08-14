type TemperatureChartProps = {
  progress: number
}

export function TemperatureChart({ progress }: TemperatureChartProps) {
  const dashOffset = 100 - progress

  return (
    <section className="temperature-chart" aria-labelledby="temperature-chart-title">
      <div className="temperature-chart__heading">
        <div>
          <span className="section-label">COOLING RESPONSE</span>
          <h3 id="temperature-chart-title">객실 온도 도달 속도</h3>
        </div>
        <div className="chart-legend" aria-label="그래프 범례">
          <span><i className="chart-legend__eco" /> 스마트 제어</span>
          <span><i className="chart-legend__fixed" /> 고정 출력</span>
        </div>
      </div>
      <div className="chart-wrap">
        <svg className="line-chart" viewBox="0 0 640 230" role="img" aria-label="스마트 제어는 목표 온도 24도에 안정적으로 도달하고 고정 출력은 목표 아래로 내려가는 비교 그래프">
          <g className="chart-grid">
            <path d="M58 25H620M58 80H620M58 135H620M58 190H620" />
            <path d="M58 25V190M198 25V190M339 25V190M479 25V190M620 25V190" />
          </g>
          <g className="chart-axis-labels">
            <text x="18" y="31">30°C</text>
            <text x="18" y="86">27°C</text>
            <text x="18" y="141">24°C</text>
            <text x="18" y="196">21°C</text>
            <text x="51" y="216">0초</text>
            <text x="187" y="216">30초</text>
            <text x="326" y="216">60초</text>
            <text x="467" y="216">90초</text>
            <text x="599" y="216">120초</text>
          </g>
          <path className="chart-target-line" d="M58 135H620" />
          <text className="chart-target-label" x="528" y="128">목표 24°C</text>
          <path
            className="chart-line chart-line--fixed"
            d="M58 25 C150 42 220 82 306 130 S472 182 620 188"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
          <path
            className="chart-line chart-line--eco"
            d="M58 25 C140 51 208 103 292 130 S458 135 620 135"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
          />
        </svg>
      </div>
      <p className="chart-caption"><strong>핵심:</strong> 센서 기반 제어는 빠르게 24°C에 도달한 뒤 출력을 조절해 과냉각과 에너지 낭비를 줄여요.</p>
    </section>
  )
}
