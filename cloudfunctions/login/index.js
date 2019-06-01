const cloud = require('wx-server-sdk')


exports.main = (event, context) => {
  cloud.init({
    env: context.namespace
  })

  const wxContext = cloud.getWXContext()

  return {
    openid: wxContext.OPENID,
    unionid: wxContext.UNIONID,
  }
}
