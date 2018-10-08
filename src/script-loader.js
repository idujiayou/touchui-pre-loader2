'use strict'

const utils = require('loader-utils')
const fs = require('fs')
const repeat = require('./libs/repeat')
const MODULE_NAME = require('./module-name')

module.exports = function (source) {
  this.cacheable()
  const _this = this
  const config = this.vux || utils.getLoaderConfig(this, 'touchui-pre')

  if (!config.plugins || !config.plugins.length) {
    return source
  }

  if (config.plugins.length) {
    config.plugins.forEach(function (plugin) {
      // script-parser
      if (plugin.name === 'script-parser') {
        if (plugin.fn) {
          source = plugin.fn.call(_this, source)
        }
      }
    })
  }

  // 模块匹配正则
  let moduleRE = new RegExp(`}\\s+from(.*?)'${MODULE_NAME}`)
  // 替换模块正则
  let replcaeRE = new RegExp(`${MODULE_NAME}\\/src`, 'g')

  if (config.options.uiWriteFile === true) {
    fs.writeFileSync(this.resourcePath + '.ui.js', source)
  }

  return source
}

function camelCaseToDash (str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}