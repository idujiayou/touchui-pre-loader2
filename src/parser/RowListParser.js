const BaseParser = require('./BaseParser')

class RowListParser extends BaseParser {
  constructor(options) {
    super(options)
  }
  handleParse () {
    let node = this.node
    this.transformTag({
      className: 'ui-row-list'
    })

    this.setTruthyClasses([
      { name: 'bordered', class: 'ui-row-list-bordered' },
      { name: 'border-left-indent', class: 'ui-row-list-border-left-indent' },
      { name: 'border-indent', class: 'ui-row-list-border-indent' }
    ])
  }
}

module.exports = RowListParser