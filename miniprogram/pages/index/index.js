//index.js
const app = getApp()

Page({
  data: {
    tab: 'pen'
  },

  tabClick(e) {
    const tab = e.currentTarget.dataset.cur
    this.setData({ tab })
  },

  toDraw() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({
        delta: 1
      })
    } else {
      wx.reLaunch({
        url: '/pages/pen/draw',
      })
    }
  },

  onLoad: function() {

  },

})
