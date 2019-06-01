export default class Painter {
  _points = []
  canvasId = 'myCanvas'

  constructor(canvasId) {
    this.canvasId = canvasId
    console.log('painter canvas id = ', canvasId)
  }

  setPoints(points) {
    if (Array.isArray(points)) {
      this._points = points
    }
  }

  getPoints() {
    return this._points
  }

  startTouch(e, color, width) {
    this._points.push([{
      x: e.touches[0].x,
      y: e.touches[0].y,
      color,
      width,
    }])
  }

  recordPoints(move, draw) {
    const l = this._points.length;
    this._points[l - 1].push({ move, draw })
  }

  reDraw(page) {
    console.log('try to redraw: %o', this._points)
    if (this._points.length == 0) {
      this.clearDraw(page);
      return
    }

    const ctx = wx.createCanvasContext(this.canvasId)
    ctx.setGlobalAlpha(page.penAlpha);
    this._points.forEach(line => {
      const { width, color, x, y } = line[0]
      // 线的宽度
      ctx.setLineWidth(width)
      // 线的颜色
      ctx.setStrokeStyle(color)
      // 起始位置
      ctx.moveTo(x, y);
      // 这些样式就默认了
      ctx.setLineCap('round')
      ctx.setLineJoin('round')

      line.forEach((p, i) => {
        if (i === 0) {
          return
        }
        ctx.moveTo(...p.move);
        ctx.quadraticCurveTo(...p.draw);
        ctx.stroke();
        ctx.draw(true)
      });
    });

    page.prevPosition = [-1, -1]
  }

  drawBack(page) {
    this._points.pop();
    this.reDraw(page, page.penAlpha)
  }

  clearDraw(page) {
    this._points = [];
    let ctx = wx.createCanvasContext(this.canvasId)
    ctx.clearRect(0, 0, page.canvasWidth, page.data.canvasHeight)
    ctx.draw(true)
    page.prevPosition = [-1, -1]
  }

  getPenSetting() {
    try {
      const res = wx.getStorageSync('pen_setting')
      if (res) {
        return res
      }
    } catch (e) {
      console.log('read pen setting error.', e)
    }
    return {
      color: '#39b54a',
      width: 12,
      alpha: 0.5,
      enable: true
    }
  }

  savePenSetting(setting) {
    let pen = this.getPenSetting()
    setting.color && (pen.color = setting.color)
    setting.width && (pen.width = setting.width)
    setting.alpha && (pen.alpha = setting.alpha)
    if (typeof setting.enable !== 'undefined') {
      pen.enable = setting.enable
    }
    console.log('update pen setting: %o', pen)
    wx.setStorage({
      key: 'pen_setting',
      data: pen
    })
  }
}