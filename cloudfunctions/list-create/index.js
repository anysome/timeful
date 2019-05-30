// 云函数入口文件
const cloud = require('wx-server-sdk')


// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: context.namespace
  })
  const db = cloud.database()

  const wxContext = cloud.getWXContext()
  const { fileID } = event
  const date = new Date()

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  let todoList = {
    year,
    month,
    day,
    date,
    points: [],
    _openid: wxContext.OPENID,
    originFileID: fileID,
    snapshotFileID: ''
  }

  const res = await db.collection('todoList').add({
    data: todoList
  })
  console.log('create todolist: ', res)

  todoList._id = res._id

  return todoList
}