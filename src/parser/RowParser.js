const BaseParser = require('./BaseParser')

class RowParser extends BaseParser {
  constructor (options) {
    super(options)
  }
  handleParse () {
    let node = this.node
    this.transformTag({
      className: 'ui-row'
    })

    this.setTruthyClasses([
      { name: 'border-top', class: 'ui-row-border-top' },
      { name: 'border-bottom', class: 'ui-row-border-bottom' }
    ])

    let attrs = []

    if (node.attribs['space-bottom']) {
      attrs.push({
        name: 'margin-bottom',
        value: `${node.attribs['space-bottom']}`,
        key: 'space-bottom',
        unit: 'px',
        delete: true
      })
    }

    if (node.attribs['space-top']) {
      attrs.push({
        name: 'margin-top',
        value: `${node.attribs['space-top']}`,
        key: 'space-top',
        unit: 'px',
        delete: true
      })
    }

    if (node.attribs['space']) {
      attrs.push({
        name: 'margin-top',
        value: `${node.attribs['space'] / 2}`,
        unit: 'px'
      })
      attrs.push({
        name: 'margin-bottom',
        value: `${node.attribs['space'] / 2}`,
        unit: 'px',
        key: 'space',
        delete: true
      })
    }

    if (node.attribs.height) {
      attrs.push({
        name: 'height',
        value: `${node.attribs.height}`,
        unit: 'px'
      })
    } else {
      if (node.parent && node.parent.attribs.class && node.parent.attribs.class.indexOf('ui-col') > -1) {
        let grandParent = node.parent.parent
        if (grandParent) {
          let grandHeight = grandParent.attribs.height

          if (grandHeight) {
            if (!node.attribs.height) {
              attrs.push({
                name: 'height',
                value: `${grandHeight}`,
                unit: 'px'
              })
              node.attribs.height = `${grandHeight}`
            }
          }
        }
      }
    }

    this.appendStyle(attrs)
  }
}

module.exports = RowParser