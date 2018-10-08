const md5 = require('md5')

module.exports = function (resourcePath) {
  let pageClass = `page-${md5(resourcePath).substring(0, 6)}`
  return pageClass
}