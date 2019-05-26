import { setPoints, reDraw, getPoints, recordPointsFun, startTouch, drawBack, clearDraw, getPenSetting, savePenSetting } from "../../utils/paint";
import { initEnv, getDefaultTodoList, createTodoList, cacheOriginalImage, getOrignalImage, updateTodoListPoints } from "../../utils/cloud";

const app = getApp();

Page({
  data: {
    tabbarHeight: 42,
    canvasHeight: 0,
    listImage: '../../images/bg-temp.jpg', // 背景图片，即导入的图片
    canDraw: true,
    isClean: true,
    penColor: '#39b54a',
    penWidth: 12,
    penSetting: false, // 是否开启画笔调整栏
    saving: false, // 是否在保存状态
    scope: false, // 是否有保存图片的权限
  },

  todoList: {},
  canvasWidth: 320,
  maxHeight: 480,
  penAlpha: 0.5,
  prevPosition: [0, 0], // 前一个移动所在位置
  movePosition: [0, 0], // 当前移动位置

  onLoad: function (options) {
    initEnv();
    let that = this;
    // 获取设备信息，canvas高度用
    wx.getSystemInfo({
      success: function (res) {
        app.globalData.systemInfo = res
        console.log("sys info %o", app.globalData.systemInfo);
        that.canvasWidth = res.windowWidth;
        that.setData({
          canvasHeight: res.windowHeight - 100
        })
        that.maxHeight = res.windowHeight - 100
      },
    })
    // 监听新图片选择后的返回处理
    app.event.on('newImage', (filePath) => {
      wx.showLoading({
        title: '加载中...',
      });
      createTodoList(filePath, record => {
        wx.hideLoading()
        console.log('reload record.', record)
        this.todoList = record
        this.resetPoints()
        cacheOriginalImage(filePath, file => {
          this.setupImage(file)
        })
      }, err => {
        wx.showToast({
          title: '保存文件失败, 请重试～',
          icon: 'none'
        })
      })
    })
    // 监听旧记录选择后的返回处理
    app.event.on('openList', (list) => {
      this.openList(list)
    })
  },

  openList(list) {
    console.log("will show old list: %o", list)
    this.todoList = list
    this.resetPoints()
    wx.showLoading({
      title: '加载中...',
    })
    getOrignalImage(list.originFileID, file => {
      this.setupImage(file);
    }, () => {
      wx.hideLoading();
    })
  },

  onUnload: function () {
    app.event.off('newImage')
    app.event.off('openList')
  },

  toggleDraw: function () {
    if (this.data.penSetting) {
      this.setData({
        penSetting: false,
        canDraw: true,
      });
      return;
    }
    this.setData({
      canDraw: !this.data.canDraw
    });
  },

  openSettingPen: function (e) {
    this.setData({
      penSetting: true,
      canDraw: true,
    });
  },

  savePhoto: function (e) {
    // utils.savePhoto(this);
  },

  addImg: function (e) {
    this.chooseImg();
  },

  setupImage(newImage) {
    let that = this;
    wx.getImageInfo({
      src: newImage,
      success: function (res) {
        console.log('image rect: %o', res)
        // 获取图片信息，重新设置画布的高度
        let height = that.canvasWidth / res.width * res.height;
        if (height > that.maxHeight) {
          height = that.maxHeight;
        }
        that.setData({
          listImage: res.path,
          canvasHeight: height
        });
        // 重新绘制笔迹
        setTimeout(() => {
          reDraw(that);
        }, 500);
      }
    });
  },

  touchStart: function (e) {
    if (!this.data.canDraw) {
      return;
    }
    // 开始画图，隐藏所有的操作栏
    this.prevPosition = [e.touches[0].x, e.touches[0].y];
    this.movePosition = [e.touches[0].x, e.touches[0].y],
      this.setData({
        penSetting: false,
        isClean: false
      });
    const { penColor, penWidth } = this.data;
    startTouch(e, penColor, penWidth);
  },

  touchMove: function (e) {
    if (!this.data.canDraw) {
      return;
    }
    const { penColor, penWidth } = this.data;
    // 触摸，绘制中。。
    const ctx = wx.createCanvasContext('myCanvas');
    ctx.setGlobalAlpha(this.penAlpha);

    const [pX, pY, cX, cY] = [...this.prevPosition, e.touches[0].x, e.touches[0].y];
    const drawPosition = [pX, pY, (cX + pX) / 2, (cY + pY) / 2];
    ctx.setLineWidth(penWidth);
    ctx.setStrokeStyle(penColor);

    ctx.setLineCap('round');
    ctx.setLineJoin('round');
    ctx.moveTo(...this.movePosition);
    ctx.quadraticCurveTo(...drawPosition);
    ctx.stroke();
    ctx.draw(true);

    recordPointsFun(this.movePosition, drawPosition)

    this.prevPosition = [cX, cY];
    this.movePosition = [(cX + pX) / 2, (cY + pY) / 2];
  },

  clearCanvas: function () {
    let that = this;
    wx.showModal({
      title: '撤销',
      content: '清空所有笔迹？',
      confirmColor: '#e54d42',
      success: function (res) {
        if (res.confirm) {
          clearDraw(that);
          that.setData({ isClean: true })
        }
      }
    });
  },

  drawBack() {
    const ctx = wx.createCanvasContext('myCanvas');
    ctx.draw();
    drawBack(this);
    if (getPoints().length === 0) {
      this.setData({ isClean: true })
    }
  },

  // 更改画笔颜色的方法
  selectColor: function (e) {
    this.setData({
      penColor: e.currentTarget.dataset.color
    });
  },

  reduceWidth: function (e) {
    let width = this.data.penWidth - e.currentTarget.dataset.diff;
    if (width < 4) {
      wx.showToast({
        title: '不能更细了',
      })
      return;
    }
    this.setData({
      penWidth: width
    });
  },

  addWidth: function (e) {
    let width = this.data.penWidth + parseInt(e.currentTarget.dataset.diff);
    if (width > 32) {
      wx.showToast({
        title: '不能更粗了',
      })
      return;
    }
    this.setData({
      penWidth: width
    });
  },

  goto: function (e) {
    wx.navigateTo({
      url: e.currentTarget.dataset.page,
    });
  },

  onReady: function () {
    // 调整控制面板的底部位置
    setTimeout(() => {
      const that = this
      wx.createSelectorQuery().select('#tabbar')
        .boundingClientRect(function (rect) {
          that.setData({
            tabbarHeight: rect.height
          })
        }).exec();
    }, 500);
    // 设置画笔
    const pen = getPenSetting();
    console.log('read pen setting: %o', pen);
    this.penAlpha = pen.alpha;
    this.setData({
      canDraw: pen.enable,
      penColor: pen.color,
      penWidth: pen.width
    });
    // 
    // 加载指定数据，或者，还原最近的记录
    const list = app.globalData.pageParam
    if (list) {
      this.openList(list)
      app.globalData.pageParam = null
    } else {
      getDefaultTodoList(list => {
        if (list._id) {
          this.openList(list)
        }
      })
    }
  },

  resetPoints: function () {
    setTimeout(() => {
      clearDraw(this);
      this.setData({ isClean: true })
    }, 150);
    if (this.todoList.points.length > 0) {
      setTimeout(() => {
        this.setData({ isClean: false })
        setPoints(this.todoList.points);
      }, 150)
    }
  },

  onHide: function () {
    if (this.todoList._id) {
      let points = getPoints();
      this.todoList.points = points
      updateTodoListPoints(this.todoList);
    }
    savePenSetting({
      color: this.data.penColor,
      width: this.data.penWidth,
      enable: this.data.canDraw
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})