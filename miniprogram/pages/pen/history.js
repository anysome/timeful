import { connect, extract } from '../../mobx/mobx-wxapp'
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
      console.log('show modal content by index = ' + currentIndex);
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
            that.doRemoveList();
          }
        }
      });
    },

    doRemoveList: function () {
      const that = this
      store.deleteList({
        index: this.data.currentIndex,
        success() {
          that.setData({
            modalOpened: false
          })
        },
        fail() {
          that.setData({
            modalOpened: false
          })
          wx.showToast({
            title: '删除数据失败，请重试',
            icon: 'none'
          })
        }
      })
    },

    openTodoList: function (e) {
      console.log('open list to edit');
      // 返回当前记录给首页
      const todoList = this.data.lists[this.data.currentIndex]
      if ( getCurrentPages().length > 1) {
        app.event.emit('openList', todoList);
        wx.navigateBack({
          delta: 1
        });
      } else {
        app.globalData.pageParam = todoList
        wx.reLaunch({
          url: 'pages/pen/draw',
        })
      }
    },
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
