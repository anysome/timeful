function savePhoto(_this) {
  // 查看授权
  if (!_this.data.scope) {
    wx.showModal({
      title: '需要授权',
      content: '保存图片需要获取您的授权',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (res) => {
              if (res.authSetting['scope.writePhotosAlbum']) {
                _this.setData({
                  scope: true,
                })
              }
            }
          });
        }
      }
    })
  }
  // 已经获得授权且不在保存中
  if (_this.data.scope && !_this.data.saving) {
    wx.showLoading({
      title: '保存中',
      mask: true,
    })
    // 关闭所有的操作栏
    _this.setData({
      penSetting: false,
      saving: true,
    })

    /*
      * 对于涂鸦照片，一共分为四步：
      * 1、将画的内容先保存出来
      * 2、然后再将照片先画在canvas上
      * 3、将画的内容覆盖的画在canvas上
      * 4、最终保存
       */
    wx.canvasToTempFilePath({
      canvasId: 'myCanvas',
      success: function (res) {
        // 把单纯用户画的内容存好了
        let src = res.tempFilePath;
        let ctx = wx.createCanvasContext('myCanvas');
        // 照片
        ctx.drawImage(_this.data.listImage, 0, 0, _this.data.canvasWidth, _this.data.canvasHeight);
        // 覆盖上画的内容
        ctx.drawImage(src, 0, 0, _this.data.canvasWidth, _this.data.canvasHeight);
        ctx.draw();

        _canvaseSaveToImg(_this);
      }
    });
  }
}

function _canvaseSaveToImg(_this) {
  // 调用微信canvas存为图片
  wx.canvasToTempFilePath({
    canvasId: 'myCanvas',
    success: function (res) {
      // 转图片成功，继续调用存储相册接口
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        // 存储成功
        success: function (r) {
          wx.hideLoading();
          wx.showToast({
            title: '保存成功',
          })
          _this.setData({
            saving: false,
          })
        },
        // 失败弹窗
        fail: function (res) {
          wx.hideLoading();
          wx.showToast({
            title: '保存失败',
            icon: 'none',
          })
          _this.setData({
            saving: false,
          })
        }
      })
    },
    fail: function (res) {
      // canvas转图片失败
      wx.hideLoading();
      wx.showToast({
        icon: 'none',
        title: '保存失败',
      })
    }
  })
}

module.exports = {
  savePhoto
}
