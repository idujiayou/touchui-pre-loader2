'use strict'

const _ = require('lodash')
const touch = require('touch')
const utils = require('loader-utils')
const yamlReader = require('js-yaml')
const fs = require('fs')
const path = require('path')
const matchI18nReg = /\$t\('?(.*?)'?\)/g

const getName = function (path) {
  return path.replace(/\\/g, '/').split('components')[1].replace('index.vue', '').replace(/\//g, '')
}

module.exports = function (source) {
  const _this = this
  this.cacheable()
  const query = this.query ? utils.parseQuery(this.query) : {}
  const config = this.vux || utils.getLoaderConfig(this, 'touchui-pre')
  if (!config.plugins || !config.plugins.length) {
    return source
  }
  const basename = path.basename(this.resourcePath)

  config.plugins.forEach(function (plugin) {
    // template-feature-switch
    /**
    <off feature="false"> show
    <on feature="true"> show

    <off feature="true"> hide
    <on feature="false"> hide
    */

    if (plugin.name === 'template-feature-switch') {
      // replace features
      if (plugin.features && source.indexOf('</on>') > -1) {
        source = parseOnFeature(source, plugin.features)
      }
      if (plugin.features && source.indexOf('</off>') > -1) {
        source = parseOffFeature(source, plugin.features)
      }
    }

    // template-parser
    if (plugin.name === 'template-parser') {
      if (plugin.fn) {
        source = plugin.fn.call(_this, source)
      }
      if (plugin.replaceList && plugin.replaceList.length) {
        plugin.replaceList.forEach(function (replacer) {
          source = source.replace(replacer.test, replacer.replaceString)
        })
      }
    }

    if (plugin.name === 'template-string-append') {
      if (new RegExp(plugin.test).test(_this.resourcePath)) {
        var componentName = basename.replace('.vue', '').toLowerCase()
        var string = plugin.fn({
          resourcePath: _this.resourcePath,
          basename: basename
        })
        if (string) {
          source = source.replace(/\s+$/g, '').replace(/\\n/g, '').replace(/<\/div>$/, string + '</div>')
        }
      }
    }
  })

  if (config.options.uiWriteFile === true) {
    fs.writeFileSync(this.resourcePath + '.vux.html', source)
  }

  return source
}

// 从page.json获取i18n配置
function getPageI18n (filePath) {
  let dir = path.dirname(filePath)
  let name = path.parse(filePath).name
  let jsonPath = path.join(dir, name) + '.json'

  if (fs.existsSync(jsonPath)) {
    let obj = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    let i18n = obj.i18n
    if (i18n) {
      return { i18n: i18n, path: jsonPath }
    }
  }
}

function parseOnFeature (content, features) {
  content = content.replace(/<on[^>]*>([\s\S]*?)<\/on>/g, function (tag, text) {
    const key = tag.split('\n')[0].replace('<on', '')
      .replace('>', '')
      .replace(/"/g, '')
      .replace(/\r/g, '')
      .split(' ')
      .filter(function (one) {
        return !!one
      }).map(function (one) {
        let tmp = one.split('=')
        return tmp[1]
      })
    if (features[key] && features[key] === true) {
      // true
      return text
    } else {
      // false
      return ''
    }
  })
  return content
}

function parseOffFeature (content, features) {
  content = content.replace(/<off[^>]*>([\s\S]*?)<\/off>/g, function (tag, text) {
    const key = tag.split('\n')[0].replace('<off', '')
      .replace('>', '')
      .replace(/"/g, '')
      .replace(/\r/g, '')
      .split(' ')
      .filter(function (one) {
        return !!one
      }).map(function (one) {
        let tmp = one.split('=')
        return tmp[1]
      })
    if (!features[key]) {
      // false
      return text
    } else {
      // true
      return ''
    }
  })
  return content
}