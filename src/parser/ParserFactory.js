const RowListParser = require('./RowListParser')
const RowParser = require('./RowParser')
const ColParser = require('./ColParser')
const ViewParser = require('./ViewParser')
const NoopParser = require('./NoopParser')
const TransferDomParser = require('./TransferDomParser')

const transferDomTags = ['ui-nav-bar', 'ui-fixed-view', 'ui-sticky', 'ui-fixed-input', 'ui-mask', 'ui-popup', 'ui-popover', 'ui-previewer']

class ParserFactory {
  static create (options) {
    let name = options.node.name
    switch (name) {
      case 'ui-view':
        return new ViewParser(options)
      case 'ui-row-list':
        return new RowListParser(options)
      case 'ui-row':
        return new RowParser(options)
      case 'ui-col':
        return new ColParser(options)
      default:
        if (transferDomTags.indexOf(name) > -1) {
          return new TransferDomParser(options)
        }
        return new NoopParser(options)
    }
  }
}

module.exports = ParserFactory