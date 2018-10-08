
const path = require('path')

module.exports = function (projectRoot, resourcePath) {
  let relativePath = path.relative(projectRoot, resourcePath)
  return /app\.ui/.test(relativePath)
}
