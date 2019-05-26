// 云函数入口文件
const cloud = require('wx-server-sdk')

// 云函数入口函数
exports.main = async (event, context) => {
  cloud.init({
    env: context.namespace
  })
  const db = cloud.database()

  let { offset, size } = event
  offset = offset || 0
  size = size || 50

  let res = await db.collection('todoList').skip(offset).limit(size).orderBy('date', 'desc').get()
  console.log('list query res: ', res)

  const lists = res.data

  const fileIDs = lists.map(list => list.originFileID)
  if (fileIDs.length > 0) {
    res = await cloud.getTempFileURL({
      fileList: fileIDs
    })
    console.log('list images res: ', res)

    const files = res.fileList
    lists.forEach( (list, i) => {
      list.image = files[i].tempFileURL
    })
  }

  return lists
}