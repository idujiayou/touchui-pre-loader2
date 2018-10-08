'use strict'

const utils = require('loader-utils')
const path = require('path')
const pkg = require('../package')

module.exports = function (source) {
  this.cacheable()
  const _this = this
  const uiConfig = this.vux || utils.getLoaderConfig(this, 'touchui-pre')
 
  if (uiConfig.plugins.length) {
    uiConfig.plugins.forEach(function (plugin) {
      // js-parser
      if (plugin.name === 'js-parser') {
        if (plugin.fn) {
          // console.log('path:' + _this.resourcePath)
          if (plugin.test && plugin.test.test(_this.resourcePath)) {
            source = plugin.fn.call(_this, source)
          } else if (!plugin.test) {
            source = plugin.fn.call(_this, source)
          }
        }
      }
    })
  }

  return source
}