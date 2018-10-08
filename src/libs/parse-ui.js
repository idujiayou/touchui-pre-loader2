const _ = require('lodash')
const htmlparser2 = require('htmlparser2')
const md5 = require('md5')

// const parseTransferDom = require('./parse-transfer-dom')
const getRootClass = require('./get-root-class')
const isRootApp = require('./is-root-app')
const parse = require('../parser')
const projectRoot = process.cwd()

//===============================================
// 基于htmlparser2的模板解析和转换处理
//===============================================

/**
 * 解析模板
 */
function parseTemplate (content, resourcePath) {
  // xmlMode: true，可处理self close标签
  // https://github.com/fb55/htmlparser2/issues/69
  let dom = htmlparser2.parseDOM(content,{ xmlMode:true })
  let pageClass = getRootClass(resourcePath)
  parse(dom, { pageClass: pageClass })
  // 为v-transfered-dom指令标记的元素添加rootClass
  // parseTransferDom(dom, pageClass)

  let parsedContent = htmlparser2.DomUtils.getOuterHTML(dom,{ xmlMode:true })
  parsedContent = parsedContent.replace(/(v-else|wx:else)=""/g, '$1')

  // 给根元素添加class
  if (!isRootApp(projectRoot, resourcePath)) {
    parsedContent = addClassForRootElement(parsedContent, pageClass)
  }
  parsedContent = compileSync(parsedContent)
  return parsedContent
}

// 双向绑定实现
function compileSync (source) {
    let syncArr = source.match(/<[^>]*(\.sync)+[^>]*>/g)

    if (syncArr) {
        syncArr.forEach(item => {
            let arr = item.split( ' ' ),
                tag = '',
                tags = [],
                syncMap = [],
                end
            
            arr.forEach((val, index) => {
                if (index === arr.length - 1) {
                    let endArr = val.match(/(\/|>)/g)
                    end = endArr ? endArr.join('') : '>'
                    val = val.replace(/(\/|>)/g, '')
                }

                if (val.indexOf('.sync') !== -1) {
                    let valKeyArr = val.split('='),
                        key = valKeyArr[0].split('.')[0].trim(),
                        valMatch = valKeyArr[1].match(/(\d|\w)+/g),
                        val2 = (valMatch ? valMatch[0] : '').trim()
                        tags.push(`${key}="{{${val2}}}"`)
                        syncMap.push(`${key}=${val2}`)
                } else {
                    tags.push(val)
                }
            })
            tags.push(`sync-attr-map="${syncMap.join('&')}"`)
            tags.push('bindsyncattrupdate="onSyncAttrUpdate"')
            tags.push(end)
            tag = tags.join(' ')
            source = source.replace(item, tag)
        })
    }
    
  return source
}

function addClassForRootElement (source, pageClass) {
  const matchClassReg = /(\s*class=["']*([\w_\s-{}]*)["']*\s*)/
  let root = source.match(/<[^>.]*>/)[0]
  // 判定元素是否已经有class属性
  if (root.match(matchClassReg)) {
    source = source.replace(root, root.replace(matchClassReg, ` class="$2 ${pageClass}"`))
  } else {
    source = source.replace(root, root.replace(/>$/, ` class="${pageClass}">`))
  }

  return source
}

module.exports = function (source, resourcePath) {
  return parseTemplate(source, resourcePath)
}
