const BaseParser = require('./BaseParser')

class ViewParser extends BaseParser {
  constructor (options) {
    super(options)
  }
  handleParse () {
    let node = this.node
    this.transformTag({
      className: 'ui-view'
    })
  }
}

module.exports = ViewParser