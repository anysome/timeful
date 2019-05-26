const app = getApp();

Page({
  data: {
    hasChoosedImg: false,
    canvasWidth: 320,
    canvasHeight: '80%',
    grayDegree: 127.5,
  },

  onLoad: function (options) {
    // 获取设备信息，canvas高度用
    const sysInfo = app.globalData.systemInfo;
    this.setData({
      canvasWidth: sysInfo.windowWidth,
      canvasHeight: sysInfo.windowHeight - 100,
    });
  },

  chooseImg: function () {
    let that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: function (res) {
        wx.getImageInfo({
          src: res.tempFilePaths[0],
          success: function (res) {
            // 获取图片信息，主要为宽高，选择合适的自适应方式（将最大边完整显示）
            let [height, width] = [that.data.canvasWidth / res.width * res.height, that.data.canvasWidth];
            if (height > that.data.canvasHeight) {
              height = that.data.canvasHeight;
            }
            const ctx = wx.createCanvasContext('foreCanvas');
            ctx.drawImage(res.path, 0, 0, width, height);
            ctx.draw();
            const backCtx = wx.createCanvasContext('backCanvas');
            backCtx.drawImage(res.path, 0, 0, width, height);
            backCtx.draw();
            that.setData({
              hasChoosedImg: true,
              canvasHeight: height,
            });
            setTimeout(() => {
              that.updateGray(that.data.grayDegree);
            }, 500);
          }
        })
      },
      fail: function (res) {
        console.log('Cancel take photo');
      }
    })
  },

  updateGray: function (threshold) {
    console.log("threshold = " + threshold);
    wx.canvasGetImageData({
      canvasId: 'backCanvas',
      x: 0,
      y: 0,
      width: this.data.canvasWidth,
      height: this.data.canvasHeight,
      success(res) {
        let data = res.data;
        for (var i = 0; i < data.length; i += 4) {
          // 灰度计算公式
          var gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // var alpha = data[i + 3];
          data[i] = gray >= threshold ? 250 : 3;                         // red
          data[i + 1] = gray >= threshold ? 218 : 49;                    // green
          data[i + 2] = gray >= threshold ? 141 : 79;                    // blue
          // data[i + 3] = alpha >= threshold ? 255 : 0;                    // alpha
        }
        wx.canvasPutImageData({
          canvasId: 'foreCanvas',
          x: 0,
          y: 0,
          width: res.width,
          height: res.height,
          data,
          success(res) {
            console.log("update image gray");
          }
        })
      }
    });
  },

  updateImage: function (e) {
    let threshold = e.detail.value * 255 / 100;
    this.setData({
      grayDegree: threshold
    });
    this.updateGray(threshold);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.chooseImg();
    setTimeout(() => {
      const that = this
      wx.createSelectorQuery().select('#canvasArea')
        .boundingClientRect(function (rect) {
          console.log('canvas rect: %o', rect)
          that.setData({
            canvasHeight: rect.height
          })
        }).exec();
    }, 500);
  },

  dismiss: function () {
    wx.navigateBack({
      delta: 1
    });
  },

  done: function () {
    wx.showLoading({
      title: '处理中...',
      mask: true,
    })
    // 调用微信canvas存为图片
    wx.canvasToTempFilePath({
      canvasId: 'foreCanvas',
      success: function (res) {
        wx.hideLoading();
        // 转图片成功，返回给首页
        app.event.emit('newImage', res.tempFilePath);
        wx.navigateBack({
          delta: 1
        });
      },
      fail: function (res) {
        wx.hideLoading();
        // canvas转图片失败
        wx.showToast({
          icon: 'loading',
          title: '保存失败',
        })
      }
    });
  }

})