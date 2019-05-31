// 云函数入口文件
const cloud = require('wx-server-sdk')


// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: context.namespace
  })
  const db = cloud.database()

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  let res = await db.collection('todoList').where({
    _openid: openid
  }).limit(1).orderBy('date', 'desc').get()
  console.log('get last todolist res: ', res)

  if (res.data.length > 0) {
    const list = res.data[0]

    res = await cloud.getTempFileURL({
      fileList: [list.originFileID]
    })
    console.log('list images res: ', res)
    if (res.fileList.length > 0) {
      list.image = res.fileList[0].tempFileURL
    }

    return list
  }

  return null
}