import painter from '../../utils/painter.js'
import { updateCachedTodoList, getDefaultTodoList } from '../../utils/cache.js'
import store from '../../mobx/list-store'

const app = getApp();

Page({
  data: {
    tabbarHeight: 42,
    canvasHeight: 0,
    todoListImage: '../../images/bg-temp.jpg',
    canDraw: true,
    isClean: true,
    penColor: '#39b54a',
    penWidth: 12,
    penSetting: false, // 是否开启画笔调整栏
  },

  todoList: {},
  canvasWidth: 320,
  maxHeight: 480,
  penAlpha: 0.5,
  prevPosition: [0, 0], // 前一个移动所在位置
  movePosition: [0, 0], // 当前移动位置

  onLoad: function (options) {
    // 调整画布
    if (app.globalData.systemInfo) {
      this.initCanvasRect(app.globalData.systemInfo)
    } else {
      const that = this
      wx.getSystemInfo({
        success: function (res) {
          that.initCanvasRect(res)
        }
      })
    }
    // 监听图片选择后，创建新记录
    app.event.on('image:take', this.createList)
    // 监听旧记录选择后的返回处理
    app.event.on('todolist:open', list => {
      this.openList(list)
      updateCachedTodoList(list)
    })
    // 判断当前记录是否被删除了
    app.event.on('todolist:remove', this.removeList)
  },

  initCanvasRect(systemInfo) {
    this.canvasWidth = systemInfo.windowWidth;
    this.setData({
      canvasHeight: systemInfo.windowHeight - 100
    })
    this.maxHeight = systemInfo.windowHeight - 100
  },

  createList(images) {
    wx.showLoading({
      title: '加载中...',
    })
    const that = this
    store.createList({
      data: images,
      success: (record) => {
        wx.hideLoading()
        console.log('create new todolist: ', record)
        updateCachedTodoList(record)
        that.todoList = record
        that.resetPoints()
        that.setupImage(images.image)
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({
          title: '保存数据出错了, 请重试～',
          icon: 'none'
        })
      }
    })
  },

  openList(list) {
    console.log("will show old list: %o", list)
    this.todoList = list
    this.resetPoints()
    this.setupImage(list.image)
  },

  removeList(listId) {
    if (this.todoList._id === listId) {
      this.setData({
        todoListImage: '../../images/bg-temp.jpg'
      })
    }
  },

  onUnload: function () {
    app.event.off('image:take')
    app.event.off('todolist:open')
    app.event.off('todolist:remove')
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
          todoListImage: newImage,
          canvasHeight: height
        });
        // 重新绘制笔迹
        setTimeout(() => {
          painter.reDraw(that);
        }, 500);
      }
    });
  },

  reloadImage() {
    const fileID = this.todoList.originFileID
    if (!fileID) {
      return
    }
    const that = this
    wx.cloud.getTempFileURL({
      fileList: [fileID],
      success: res => {
        console.log('temp url:', res)
        if (res.fileList.length > 0) {
          that.setupImage(res.fileList[0].tempFileURL)
        }
      }
    })
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
    painter.startTouch(e, penColor, penWidth);
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

    painter.recordPoints(this.movePosition, drawPosition)

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
          painter.clearDraw(that);
          that.setData({ isClean: true })
        }
      }
    });
  },

  drawBack() {
    const ctx = wx.createCanvasContext('myCanvas');
    ctx.draw();
    painter.drawBack(this);
    if (painter.getPoints().length === 0) {
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

  takePhoto: function () {
    wx.navigateTo({
      url: './photo'
    })
  },

  onReady: function () {
    // 设置弹出控制面板的底部位置
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
    const pen = painter.getPenSetting();
    this.penAlpha = pen.alpha;
    this.setData({
      canDraw: pen.enable,
      penColor: pen.color,
      penWidth: pen.width
    });
    // 初次使用，弹出操作提示
    if (!wx.getStorageSync('tips-already')) {
      wx.showModal({
        title: '操作提示',
        content: '长按画笔按钮可更改画笔颜色',
        confirmColor: '#39b54a',
        confirmText: '下一条',
        success: function (res) {
          wx.showModal({
            title: '操作提示',
            content: '长按撤销按钮可清空笔迹',
            confirmColor: '#39b54a',
          })
        }
      })
      wx.setStorage({
        key: 'tips-already',
        data: '1',
      })
    }
    // 加载指定数据，或者，还原最近的记录
    const list = app.globalData.pageParam
    if (list) {
      this.openList(list)
      updateCachedTodoList(list)
      app.globalData.pageParam = null
    } else {
      wx.showLoading({
        title: '加载中...',
      })
      getDefaultTodoList({
        success: list => {
          wx.hideLoading()
          this.openList(list)
        },
        empty: () => {
          wx.hideLoading()
        }
      })
    }
  },

  resetPoints: function () {
    setTimeout(() => {
      painter.clearDraw(this);
      this.setData({ isClean: true })
    }, 150);
    if (this.todoList.points && this.todoList.points.length > 0) {
      setTimeout(() => {
        this.setData({ isClean: false })
        painter.setPoints(this.todoList.points);
      }, 150)
    }
  },

  onHide: function () {
    // 保存数据
    console.log('hide todolist: ', this.todoList)
    if (this.todoList._id) {
      let points = painter.getPoints();
      store.updateListPoints({
        list: this.todoList,
        points,
        success: updateCachedTodoList
      })
    }
    painter.savePenSetting({
      color: this.data.penColor,
      width: this.data.penWidth,
      enable: this.data.canDraw
    });
  },

  onShareAppMessage: function () {
    return {
      title: '我的清单'
    }
  }
})