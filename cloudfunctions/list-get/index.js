// 云函数入口文件
const cloud = require('wx-server-sdk')


// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: context.namespace
  })
  const db = cloud.database()
  const { id } = event

  let res = await db.collection('todoList').doc(id).get()
  console.log('get todolist res: ', res)

  const list = res.data

  if (list) {
    res = await cloud.getTempFileURL({
      fileList: [list.originFileID]
    })
    console.log('list images res: ', res)
    if (res.fileList.length > 0) {
      list.image = res.fileList[0].tempFileURL
    }
    return list
  } else {
    return {}
  }
}