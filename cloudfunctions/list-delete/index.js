// 云函数入口文件
const cloud = require('wx-server-sdk')


// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: context.namespace
  })
  const db = cloud.database()

  const { _id, originFileID } = event

  // 删除文件
  let res = await cloud.deleteFile({
    fileList: [originFileID]
  })

  // 删除记录
  res = await db.collection('todoList').doc(_id).remove()
  console.log('remove todolist: ', res)

  return res.stats.removed
}