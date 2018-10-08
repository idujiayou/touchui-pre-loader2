'use strict'

const utils = require('loader-utils')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const htmlparser2 = require('htmlparser2')

const rpx2rem = require('./libs/rpx2rem')
const parseTransferDom = require('./libs/parse-transfer-dom')
const globalTagList = require('./libs/global-tag-list')
const getRootClass = require('./libs/get-root-class')
const isRootApp = require('./libs/is-root-app')
const matchRootClassReg = /\s*<template>\s*<[\w-]+.*(\s*class=["']*([\w_\s-]*)["']*\s*)/

function getParsedTemplate (source, pageClass) {
  let htmlAst = htmlparser2.parseDOM(source, { xmlNode: true })
  parseTransferDom(htmlAst, pageClass)
  let rootElementClassList = addClassForRoot(htmlAst, pageClass)
  return {
    html: htmlparser2.DomUtils.getOuterHTML(htmlAst, { xmlMode: true }),
    rootElementClassList: rootElementClassList
  }
}

function addClassForRoot (htmlAst, pageClass) {
  let templateNode
  // 可能会有注释、文本节点
  for (let i = 0; i < htmlAst.length; i++) {
    if (htmlAst[i].type === 'tag' && htmlAst[i].name === 'template') {
      templateNode = htmlAst[i]
      break
    }
  }
  let children = templateNode.children
  for (let i = 0; i < children.length; i++) {
    let node = children[i]
    if (node.type === 'tag') {
      let rootElementClassList = []
      let rootClassAttr = node.attribs.class
      if (rootClassAttr) {
        rootElementClassList = _.filter(rootClassAttr.split(' '), function (item) {
          return !!item
        })
        node.attribs.class += ` ${pageClass}`
      } else {
        node.attribs.class = pageClass
      }
      return rootElementClassList
    }
  }
}

/**
 * 改写用户编写的样式代码
 * 为ui-fixed-view, ui-mask, ui-popup, ui-popover等组件添加root class
 */
function rewriteStyleSource (templateSource, styleSource, className) {
  let index = styleSource.indexOf('/* TouchUI Scoped Styles */')
  let componentStyle = styleSource.substring(0, index)
  let scopedStyle = styleSource.substring(index).replace('/* TouchUI Scoped Styles */', '')

  scopedStyle = `
  /* TouchUI Scoped Styles */
  .${className}
  {
    ${scopedStyle}
  }`

  // 获取添加了root class的模板内容
  let parsed = getParsedTemplate(templateSource, className)
  templateSource = parsed.html
  let classList = getClassListByRootClass(templateSource, className)
  classList = classList.concat(parsed.rootElementClassList)

  classList.forEach((cls) => {
    scopedStyle = scopedStyle.replace(new RegExp(`[.]${cls}[\\s\\t\\r\\n]*\{`), `&.${cls} {`)
  })

  let rewrittenStyle = componentStyle + scopedStyle

  return rewrittenStyle
}

/**
 * 提取模板中绑定了root class的类名列表
 */
function getClassListByRootClass (templateSource, className) {

  var reStr = `class=['"]*(.*)${className}\s*['"]`
  let RE1 = new RegExp(reStr, 'ig')
  var RE2 = new RegExp(reStr)
  let matches = templateSource.match(RE1)
  let classList = globalTagList.slice()

  if (matches) {
    for (let i = 0; i < matches.length; i++) {
      let innerMatches = matches[i].match(RE2)
      if (innerMatches && innerMatches[1]) {
        classList = classList.concat(innerMatches[1].split(/\s+/))
      }
    }
  }

  return _(classList)
    .filter(function (item) {
      return !!item
    })
    .uniq()
    .value()
}

module.exports = function (source) {
  this.cacheable()
  const _this = this
  const config = this.vux || utils.getLoaderConfig(this, 'touchui-pre')

  if (!config.plugins || !config.plugins.length) {
    return source
  }

  config.plugins.forEach(function (plugin) {
    // style-parser
    if (plugin.name === 'style-parser') {
      if (plugin.fn) {
        source = plugin.fn.call(_this, source)
      }
    }
  })

  if (this.resourcePath.indexOf('.ui') > -1) {
    source = rpx2rem(source)

    let templateSource = fs.readFileSync(this.resourcePath, 'utf-8')
    let pageClass = getRootClass(this.resourcePath)

    // 改写用户的样式，app.ui文件不改写
    if (!isRootApp(config.options.projectRoot, this.resourcePath)) {
      source = rewriteStyleSource(templateSource, source, pageClass)
    }
  }

  return source
}
