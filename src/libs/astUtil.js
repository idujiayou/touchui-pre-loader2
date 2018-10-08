const Generator = require('babel-generator').CodeGenerator

module.exports = {
	/**
	 * 是否定义了指定名称的节点
	 */
  hasDeclaredNode: function (declaration, name) {
    let properties = declaration.properties
    for (let i = 0; i < properties.length; i++) {
      if (properties[i].type === 'ObjectProperty' && properties[i].key.name === name) {
        return true
      }
    }
  },
	/**
	 * 查找指定名称的节点
	 */
  findDeclaredNode: function (declaration, name) {
    let properties = declaration.properties
    for (let i = 0; i < properties.length; i++) {
      if (properties[i].type === 'ObjectProperty' && properties[i].key.name === name) {
        return properties[i]
      }
    }
  },
	/**
	 * 查找指定名称的节点下，已经定义的属性名称
	 */
  getDeclaredNodeProperties: function (declaration, name) {
    let node = this.findDeclaredNode(declaration, name)
    let names = []

    if (node) {
      let nodeProperties = node.value.properties
      for (let i = 0; i < nodeProperties.length; i++) {
        names.push(nodeProperties[i].key.name)
      }
    }

    return names
  },
  findImportDeclaration: function (body, value) {
    let declaration
    for (let i = 0; i < body.length; i++) {
      if (body[i].type === 'ImportDeclaration'
        && body[i].source.type === 'Literal'
        && body[i].source.value === moduleName) {
        return body[i]
      }
    }
  },
	/**
	 * 生成导入说明符
	 */
  generateImportSpecifiers: function (names) {
    return names.map(function (name) {
      return {
        type: 'ImportSpecifier',
        imported: {
          type: 'Identifier',
          name: name
        },
        local: {
          type: 'Identifier',
          name: name
        }
      }
    })
  },
	/**
	 * 生成属性
	 */
  generateProperties: function (names, resourcePath) {
		/*
		let relative = '..'
    // 多级目录处理
		let matches = resourcePath.match(/src(\/|\\)pages(.*)/)
    if (matches && matches[2]) {
      relative = repeat('../', matches[2].match(/(\/|\\)/g).length)
      relative = relative.substring(0, relative.length - 1)
    } else if (/src(\/|\\)[\w-_.]*\.ui/.test(resourcePath)) {
			relative = '.'
		}
		*/

    return names.map(function (name) {
      return {
        type: 'ObjectProperty',
        expression: true,
        async: false,
        generator: false,
        key: {
          type: 'Identifier',
          name: name
        },
        value: {
          type: 'Identifier',
          name: name
          // name: `() => import(/* webpackChunkName: "components" */ '${path}')`
        }
      }
    })
  },
	/**
	 * 基于babel-generator生成js代码
	 */
  generateEsCode: function (ast, script) {
    var gen = new Generator(ast, {
      quotes: 'single'
    }, script)
    const output = gen.generate()
    return output.code
  }
}
