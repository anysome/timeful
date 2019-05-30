import { observable } from './mobx'

const app = getApp()

const store = observable({

  // observable
  lists: [],
  listsLoading: false,
  currentIndex: -1,

  // computed
  get current() {
    if ( currentIndex === -1) {
      return null
    }
    return this.lists[currentIndex]
  },

  // actions
  checkAndLoad() {
    if (this.lists.length === 0) {
      this.loadLists()
    }
  },

  loadLists() {
    this.listsLoading = true
    const that = this
    wx.cloud.callFunction({
      name: 'list-history',
      data: {
        offset: this.lists.length,
        size: 30
      },
      success: res => {
        console.log('get lists form cloud', res.result)
        that.lists = that.lists.concat(res.result)
        that.listsLoading = false
      },
      fail: err => {
        console.log('[云函数] 获取 lists 失败.', err)
        that.listsLoading = false
      }
    })
  },

  addList(options) {
    const { data } = options
    const that = this
    wx.cloud.callFunction({
      name: 'list-create',
      data: { fileID: data.fileID },
      success: res => {
        res.result.image = data.image
        that.lists.unshift(res.result)
        that.currentIndex = 0
        options.success && options.success(res.result)
      },
      fail: err => {
        console.log('[云函数] 创建 list 失败.', err)
        options.fail && options.fail(err)
      }
    })
  },

  deleteList(options) {
    const record = this.lists[options.index]
    const removedId = record._id
    app.event.emit('todolist:remove', removeId)
    const that = this
    let lists = this.lists
    wx.cloud.callFunction({
      name: 'list-delete',
      data: record,
      success: res => {
        if (res.result) {
          lists.splice(options.index, 1)
          that.lists = lists
        }
        options.success && options.success()
      },
      fail: err => {
        console.log('[云函数] 删除 list 失败.', err)
        options.fail && options.fail(err)
      }
    })
  },

})

export default store