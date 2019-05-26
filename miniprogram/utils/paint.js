let recordPoints = [];

export const setPoints = (points) => {
  recordPoints = points;
}

export const getPoints = () => {
  return recordPoints;
}

// 记录一条线的起始点，顺便记录一下这条线的颜色和为宽度
export const startTouch = (e, color, width) => {
  recordPoints.push([{
    x: e.touches[0].x,
    y: e.touches[0].y,
    color,
    width,
  }]);
};

// 记录一条线内的每个点
export const recordPointsFun = (move, draw) => {
  const l = recordPoints.length;
  recordPoints[l-1].push({ move, draw });
};

// 绘制过程
export const reDraw = (_this) => {
  if (recordPoints.length == 0) {
    clearDraw(_this);
    return;
  }

  const ctx = wx.createCanvasContext('myCanvas');
  ctx.setGlobalAlpha(_this.penAlpha);
  recordPoints.forEach(line => {
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
export const drawBack = (_this) => {
  recordPoints.pop();
  reDraw(_this, _this.penAlpha);
};

// 清空globalData里的点数据
export const clearDraw = (_this) => {
  recordPoints.length = 0;
  let ctx = wx.createCanvasContext('myCanvas');
  ctx.clearRect(0, 0, _this.canvasWidth, _this.data.canvasHeight);
  ctx.draw();
};

export const eraseDraw = (e, _this) => {
  const ctx = wx.createCanvasContext('myCanvas');
  const { x, y } = e.touches[0];
  ctx.clearRect(x, y, 20, 20);
  ctx.draw();
}

export const getPenSetting = () => {
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

export const savePenSetting = (setting) => {
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