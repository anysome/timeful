import { connect } from '../../mobx/mobx-wxapp'
import store from '../../mobx/list-store'

const app = getApp();

Component({
  options: {
    addGlobalClass: true,
  },

  data: {
    lists: [],
    loading: false,
    modalOpened: false,
    currentIndex: 0
  },

  methods: {

    showModal: function (e) {
      const currentIndex = e.currentTarget.dataset.index
      this.setData({
        currentIndex,
        modalOpened: true
      });
    },

    hideModal: function () {
      this.setData({
        modalOpened: false
      });
    },

    deleteTodoList: function (e) {
      let that = this;
      wx.showModal({
        title: '删除 ?',
        content: '将彻底删除数据',
        confirmColor: '#e54d42',
        success: function (res) {
          if (res.confirm) {
            that.hideModal()
            that.doRemoveList()
          }
        }
      });
    },

    doRemoveList: function () {
      wx.showLoading({
        title: '删除中...',
      })
      const that = this
      store.deleteList({
        index: this.data.currentIndex,
        success() {
          wx.hideLoading()
        },
        fail() {
          wx.hideLoading()
          wx.showToast({
            title: '删除数据失败，请重试',
            icon: 'none'
          })
        }
      })
    },

    openTodoList: function (e) {
      // 返回当前记录给首页
      const todoList = this.data.lists[this.data.currentIndex]
      if ( getCurrentPages().length > 1) {
        app.event.emit('todolist:open', todoList);
        wx.navigateBack({
          delta: 1
        });
      } else {
        app.globalData.pageParam = todoList
        wx.redirectTo({
          url: '/pages/pen/draw',
        })
      }
    },

    loadMore: function() {
      store.loadLists({
        success(hasLeft) {
          if (!hasLeft) {
            wx.showToast({
              title: '没有更多记录了',
              icon: 'none'
            })
          }
        },
        fail(err) {
          wx.showToast({
            title: '出错了，请重试',
            icon: 'none'
          })
        }
      })
    }
  },

  lifetimes: {

    attached() {
      store.checkAndLoad()
    },

    ready() {
      this.disposer = connect(this, () => ({
        loading: store.listsLoading,
        lists: store.lists
      }))
    },

    detached() {
      this.disposer()
    },

  },

})
