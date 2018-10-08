const _ = require('lodash')

module.exports = {
  camelCase2Dash(str) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
  },
  dash2CamelCase(str) {
    return str.replace(/\-([a-z])/gi, function (m, w) {
      return w.toUpperCase()
    })
  },
  /**
   * 将camelCase属性名称转换为dash属性名称
   *
   * @private
   * @param {*} node
   * @param {string} attr
   * @memberof NodeUtil
   */
  normalizeNodeAttr(nodes, attr) {
    let camelCaseAttr = this.dash2CamelCase(attr)
    let dashAttr = this.camelCase2Dash(attr)

    // 只有当attr为camelCase时
    if (node.attribs[camelCaseAttr] && attr !== dashAttr) {
      node.attribs[attr] = node.attribs[camelCaseAttr]
      delete node.attribs[camelCaseAttr]
    }
  },
  /**
   * 将标签转换为指定tag，并设定class和style
   *
   * @param {*} options
   * @memberof NodeUtil
   */
  transformTag(options) {
    let { node, className, tag } = options
    node.name = tag || 'div'
    if (!node.attribs.class) {
      node.attribs.class = className
    } else {
      let str = this.getClassObjectString(node)
      if (str) {
        if (/\{.*\}/.test(str)) {
          node.attribs[':class'] = `[${str}, '${className}']`
        } else {
          node.attribs[':class'] = `[{${str}}, '${className}']`
        }
        delete node.attribs.class
      } else {
        node.attribs.class += ` ${className}`
      }
    }

    if (!node.attribs.style) {
      node.attribs.style = ''
    } else {
      let { style, type } = this.getStyleObjectString(node)
      if (style) {
        if (type === 'object') {
          node.attribs[':style'] = `{${style}}`
        } else if (type === 'array') {
          node.attribs[':style'] = `[${style}]`
        } else if (type === 'objectVariable') {
          node.attribs[':style'] = `${style}`
        }
        delete node.attribs.style
      } else if (node.attribs.style.slice(-1) !== ';') {
        node.attribs.style += ';'
      }
    }
  },
  /**
   * 根据Boolean属性设置class，类似vue的class绑定
   * 例如：{ 'active': isActive }
   *
   * @param {*} node
   * @param {*} props
   * @memberof NodeUtil
   */
  setTruthyClasses(node, props) {
    props.forEach((prop) => {
      if (node.attribs[prop.name] !== undefined) {
        node.attribs.class += ` ${prop.class}`
        delete node.attribs[prop.name]
      }
    })
  },
  getClassObjectString(node) {
    if (node.attribs.class) {
      let match = node.attribs.class.match(/{\{\s*(\{|\[)((.|\r|\n)*)(\}|\])\s*\}\}/)
      if (match && match[2]) {
        return _.trim(match[2])
      }
    }
  },
  getStyleObjectString(node, attrName) {
    if (node.attribs.style) {
      let match = node.attribs.style.match(/{\{\s*\{([^\}]*)\}\s*\}\}/)

      if (match && match[1]) {
        return {
          type: 'object',
          style: _.trim(match[1])
        }
      }

      match = node.attribs.style.match(/{\{\s*\[([^\]]*)\]\s*\}\}/)
      if (match && match[1]) {
        return {
          type: 'array',
          style: _.trim(match[1])
        }
      }

      match = node.attribs.style.match(/{\{\s*([^\}]*)\s*\}\}/)
      if (match && match[1]) {
        return {
          type: 'objectVariable',
          style: _.trim(match[1])
        }
      }

      match = node.attribs.style.match(/{\{\s*\{(.*)\}\s*\}\}/)
      if (match && match[1]) {
        return {
          type: 'object',
          style: _.trim(match[1])
        }
      }
    }

    return {}
  },
  transformAttrValue(attr) {
    let { value, unit = '' } = attr
    let match = value.match(/\{\{(.*)\}\}/)
    if (match && match[1]) {
      if (attr.valueTransFn) {
        return attr.valueTransFn(value)
      } else {
        let transValue = unit ? match[1] + `+ '${unit}'` : match[1]
        return _.trim(transValue)
      }

    } else {
      return _.trim(`'${value}${unit}'`)
    }
  },
  appendStyle(options) {
    let { node, attrs, objectStyle = '' } = options

    attrs.forEach((attr) => {
      objectStyle += `,'${attr.name}': ${this.transformAttrValue(attr)}`
      if (attr.delete) {
        delete node.attribs[attr.key]
      }
    })
    node.attribs[':style'] = `{ ${_.trimStart(objectStyle, ',')} }`
  }
}