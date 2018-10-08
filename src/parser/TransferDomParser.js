const BaseParser = require('./BaseParser')

class TransferDomParser extends BaseParser {
  constructor (options) {
    super(options)
  }
  handleParse () {
    let node = this.node
    if (node.type === 'tag') {
      let pageClass = this.options.pageClass
      node.attribs = node.attribs || {}
      if (node.attribs.class) {
        node.attribs.class += ` ${pageClass}`
      } else {
        node.attribs.class = pageClass
      }
    }
  }
}

module.exports = TransferDomParser