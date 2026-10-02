/**
 * VelocityType - High-DPI Canvas Performance Chart
 * Renders smooth spline curves for WPM, Raw WPM, and Error event markers
 */

export class PerformanceChart {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext("2d");
    this.data = [];
  }

  /**
   * Render WPM timeline graph
   * @param {Array<{second: number, wpm: number, rawWpm: number, errors: number}>} timelineData
   * @param {Object} colors { primary, secondary, error, grid, text }
   */
  render(timelineData, colors = {}) {
    if (!this.canvas || !timelineData || timelineData.length === 0) return;

    this.data = timelineData;
    const ctx = this.ctx;
    const canvas = this.canvas;

    // Handle high DPI displays (Retina, 4K)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 600;
    const height = rect.height || 200;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Theme color fallbacks
    const colAccent = colors.primary || "#38bdf8";
    const colRaw = colors.secondary || "rgba(255, 255, 255, 0.25)";
    const colError = colors.error || "#ef4444";
    const colGrid = colors.grid || "rgba(255, 255, 255, 0.08)";
    const colText = colors.text || "rgba(255, 255, 255, 0.5)";

    const padding = { top: 25, right: 30, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Determine max values for scaling
    let maxWpm = Math.max(
      40,
      ...timelineData.map(d => Math.max(d.wpm || 0, d.rawWpm || 0))
    );
    maxWpm = Math.ceil(maxWpm / 20) * 20; // Round up to next 20

    const totalSeconds = Math.max(timelineData[timelineData.length - 1].second, 1);

    const getX = (sec) => padding.left + (sec / totalSeconds) * chartW;
    const getY = (val) => padding.top + chartH - (val / maxWpm) * chartH;

    // 1. Draw Grid & Y-Axis Labels
    ctx.strokeStyle = colGrid;
    ctx.lineWidth = 1;
    ctx.fillStyle = colText;
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = Math.round((maxWpm / ySteps) * i);
      const y = getY(val);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillText(`${val}`, padding.left - 8, y);
    }

    // 2. Draw X-Axis Labels (Seconds)
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const xStepCount = Math.min(totalSeconds, 6);
    for (let i = 0; i <= xStepCount; i++) {
      const sec = Math.round((totalSeconds / xStepCount) * i);
      const x = getX(sec);
      ctx.fillText(`${sec}s`, x, height - padding.bottom + 8);
    }

    // Helper: Draw smooth Bezier curve
    const drawCurve = (points, strokeColor, fillColor = null, isDashed = false) => {
      if (points.length < 2) return;

      ctx.save();
      ctx.beginPath();
      if (isDashed) {
        ctx.setLineDash([4, 4]);
      }

      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i != points.length - 2 ? points[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;

        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Gradient area fill
      if (fillColor) {
        ctx.lineTo(points[points.length - 1].x, getY(0));
        ctx.lineTo(points[0].x, getY(0));
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, fillColor);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.restore();
    };

    // 3. Prepare Points for Raw WPM (Dashed curve)
    const rawPoints = timelineData.map(d => ({
      x: getX(d.second),
      y: getY(d.rawWpm || d.wpm)
    }));
    drawCurve(rawPoints, colRaw, null, true);

    // 4. Prepare Points for Net WPM (Solid smooth curve + area)
    const wpmPoints = timelineData.map(d => ({
      x: getX(d.second),
      y: getY(d.wpm)
    }));
    const fillCol = colAccent.startsWith("#") ? `${colAccent}33` : "rgba(56, 189, 248, 0.2)";
    drawCurve(wpmPoints, colAccent, fillCol, false);

    // 5. Draw Error Event Markers (Red cross/dots)
    timelineData.forEach(d => {
      if (d.errors && d.errors > 0) {
        const x = getX(d.second);
        const y = getY(d.wpm);

        // Error glowing cross/circle
        ctx.save();
        ctx.fillStyle = colError;
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Small indicator text for multiple errors
        if (d.errors > 1) {
          ctx.fillStyle = colError;
          ctx.font = "bold 9px monospace";
          ctx.fillText(`×${d.errors}`, x, y - 8);
        }
        ctx.restore();
      }
    });

    // 6. Draw Legend in upper right
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";

    // Net WPM legend
    ctx.fillStyle = colAccent;
    ctx.fillRect(width - padding.right - 140, padding.top - 12, 10, 10);
    ctx.fillText("WPM", width - padding.right - 124, padding.top - 3);

    // Raw WPM legend
    ctx.fillStyle = colRaw;
    ctx.fillRect(width - padding.right - 75, padding.top - 12, 10, 10);
    ctx.fillText("Raw", width - padding.right - 59, padding.top - 3);
  }
}
