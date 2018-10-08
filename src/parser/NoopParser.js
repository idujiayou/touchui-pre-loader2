const BaseParser = require('./BaseParser')

class NoopParser extends BaseParser {
  constructor (options) {
    super(options)
  }
  handleParse () {

  }
}


module.exports = NoopParser