const fs = require('fs')
const _ = require('lodash')
const babylon = require('babylon')
const htmlparser2 = require('htmlparser2')
const astUtil = require('./astUtil')

const configUtil = {
  getConfigStr(path) {
    let html = fs.readFileSync(path, 'utf-8')
    let htmlAst = htmlparser2.parseDOM(html)
    let scriptAst = _.find(htmlAst, { type: 'script', name: 'script' })
    if (scriptAst) {
      let script = scriptAst.children[0].data

      let ast = babylon.parse(script, {
        sourceType: 'module',
        plugins: [
          // 支持动态import
          'dynamicImport',
          // 支持rest和spread运算符
          'objectRestSpread'
        ]
      })

      let body = ast.program.body

      let exportDeclaration
      for (let i = 0; i < body.length; i++) {
        if (body[i].type === 'ExportDefaultDeclaration') {
          exportDeclaration = body[i]
        }
      }

      let configNode = astUtil.findDeclaredNode(exportDeclaration.declaration, 'config')
      if (configNode) {
        let code = astUtil.generateEsCode(configNode)
        return code.match(/config:\s*(\{(.|\n)*\})/)[1]
      } else {
        return '{}'
      }
    }
  },
  getConfigObj(path) {
    let str = this.getConfigStr(path)
    return str ? eval('(' + str + ')') : {}
  }
}

module.exports = configUtil
//
// module.exports = function (path) {
//   let html = fs.readFileSync(path, 'utf-8')
//   let htmlAst = htmlparser2.parseDOM(html)
//   let scriptAst = _.find(htmlAst, { type: 'script', name: 'script' })
//   let script = scriptAst.children[0].data
//
//   let ast = babylon.parse(script, {
//     sourceType: 'module',
//     plugins: [
//       // 支持动态import
//       'dynamicImport',
//       // 支持rest和spread运算符
//       'objectRestSpread'
//     ]
//   })
//
//   let body = ast.program.body
//
//   let importDeclaration, exportDeclaration
//   for (let i = 0; i < body.length; i++) {
//     if (body[i].type === 'ImportDeclaration' && body[i].source.value === moduleName) {
//       importDeclaration = body[i]
//     }
//
//     if (body[i].type === 'ExportDefaultDeclaration') {
//       exportDeclaration = body[i]
//     }
//   }
//
//   let configNode = astUtil.findDeclaredNode(exportDeclaration.declaration, 'config')
//   let data = eval('({' + astUtil.generateEsCode(configNode) + '})')
//
//   return data.config
// }
