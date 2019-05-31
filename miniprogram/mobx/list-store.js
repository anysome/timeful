import { observable } from './mobx'

const app = getApp()

const store = observable({

  // observable
  lists: [],
  listsLoading: false,
  currentIndex: -1,
  remoteLoaded: false,

  // computed
  get current() {
    if ( currentIndex === -1) {
      return null
    }
    return this.lists[currentIndex]
  },

  // actions
  checkAndLoad() {
    if (!this.remoteLoaded) {
      this.loadLists({})
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
        that.remoteLoaded = true
      },
      fail: err => {
        console.log('[云函数] 获取 lists 失败.', err)
        that.listsLoading = false
      }
    })
  },

  createList(options) {
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

  updateListPoints(options) {
    const { list, points } = options
    // update mobx
    const { list: record, index } = this.getListById(list._id)
    if (index > -1) {
      record.points = points
    }
    list.points = points
    const db = wx.cloud.database()
    db.collection('todoList').doc(list._id).update({
      data: {
        points: points
      },
      success(res) {
        console.log("upload points to cloud.", points)
        options.success && options.success(list)
      }
    })
  },

  getListById(id) {
    let list, index = -1
    this.lists.some((record, i) => {
      const found = record._id === id
      if (found) {
        list = record
        index = i
      }
      return found
    })
    return { list, index }
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