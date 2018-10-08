const tool = require('./tool')
const _ = require('lodash')

class BaseParser {
  constructor (options) {
    this.options = options
    this.node = options.node
    this.objectStyle = tool.getStyleObjectString(this.node).style
  }
  transformTag (options) {
    tool.transformTag(Object.assign({}, options, { node: this.node }))
  }
  setTruthyClasses (attrs) {
    tool.setTruthyClasses(this.node, attrs)
  }
  appendStyle (attrs) {
    tool.appendStyle({
      node: this.node,
      objectStyle: this.objectStyle,
      attrs: attrs
    })
  }
}

module.exports = BaseParser