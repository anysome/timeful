let _points = [];

const setPoints = (points) => {
  _points = points;
}

const getPoints = () => {
  return _points;
}

// 记录一条线的起始点，顺便记录一下这条线的颜色和为宽度
const startTouch = (e, color, width) => {
  _points.push([{
    x: e.touches[0].x,
    y: e.touches[0].y,
    color,
    width,
  }]);
};

// 记录一条线内的每个点
const recordPoints = (move, draw) => {
  const l = _points.length;
  _points[l-1].push({ move, draw });
};

// 还原笔迹
const reDraw = (_this) => {
  console.log('try to redraw: %o', _points)
  if (_points.length == 0) {
    clearDraw(_this);
    return;
  }

  const ctx = wx.createCanvasContext('myCanvas');
  ctx.setGlobalAlpha(_this.penAlpha);
  _points.forEach(line => {
    const { width, color, x, y } = line[0];
    // 线的宽度
    ctx.setLineWidth(width);
    // 线的颜色
    ctx.setStrokeStyle(color);
    // 起始位置
    ctx.moveTo(x, y);
    // 这些样式就默认了
    ctx.setLineCap('round');
    ctx.setLineJoin('round');

    line.forEach((p, i) => {
      if (i === 0) {
        return;
      }
      ctx.moveTo(...p.move);
      ctx.quadraticCurveTo(...p.draw);
      ctx.stroke();
      ctx.draw(true);
    });
  });

  _this.setData({
    prevPosition: [-1, -1]
  });
};

// 后退
const drawBack = (_this) => {
  _points.pop();
  reDraw(_this, _this.penAlpha);
};

// 清空所有笔迹
const clearDraw = (_this) => {
  _points.length = 0;
  let ctx = wx.createCanvasContext('myCanvas');
  ctx.clearRect(0, 0, _this.canvasWidth, _this.data.canvasHeight);
  ctx.draw();
};

const getPenSetting = () => {
  try {
    const res = wx.getStorageSync('pen_setting');
    if (res) {
      return res
    }
  } catch (e) {
    console.log('read pen setting error.', e);
  }
  return {
    color: '#39b54a',
    width: 12,
    alpha: 0.5,
    enable: true
  };
}

const savePenSetting = (setting) => {
  let pen = getPenSetting();
  setting.color && (pen.color = setting.color);
  setting.width && (pen.width = setting.width);
  setting.alpha && (pen.alpha = setting.alpha);
  if (typeof setting.enable !== 'undefined') {
    pen.enable = setting.enable
  }
  console.log('update pen setting: %o', pen);
  wx.setStorage({
    key: 'pen_setting',
    data: pen
  })
}

export {
  setPoints,
  getPoints,
  startTouch,
  recordPoints,
  reDraw,
  drawBack,
  clearDraw,
  getPenSetting,
  savePenSetting
}