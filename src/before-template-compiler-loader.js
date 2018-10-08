'use strict'

const utils = require('loader-utils')
const parseUi = require('./libs/parse-ui')

module.exports = function (source) {
  this.cacheable()
  const _this = this
  const config = this.vux || utils.getLoaderConfig(this, 'vux')
  /**
   * 1. 将tap, longtap事件分别转换为v-tap, v-longtap指令
   * 2. 给页面根元素添加root class，给fixed-view, mask, popup, popover添加root class
   */
  if (this.resourcePath.indexOf('.ui') > -1) {
    source = parseUi(source, this.resourcePath)
  }

  if (!config.plugins || !config.plugins.length) {
    return source
  }

  config.plugins.forEach(function (plugin) {
    // style-parser
    if (plugin.name === 'before-template-compiler-parser') {
      if (plugin.fn) {
        source = plugin.fn.call(_this, source)
      }
    }
  })

  return source
}
