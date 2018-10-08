const BaseParser = require('./BaseParser')

class ColParser extends BaseParser {
  constructor (options) {
    super(options)
  }
  handleParse () {
    let node = this.node
    this.transformTag({ className: 'ui-col' })

    let recurse = this.options.recurse
    let oldChildren = node.children

    let colContent = {
      type: 'tag',
      name: 'div',
      attribs: {
        class: 'ui-col-content'
      },
      children: oldChildren
    }

    let attrs = []

    if (node.attribs.span) {
      node.attribs.class += ` ui-col-${node.attribs.span}`
      // node.attribs.style += `flex: 0 0 ${Number(node.attribs.span) / 12 * 100}%;`
      attrs.push({
        name: 'flex',
        value: `0 0 ${Number(node.attribs.span) / 12 * 100}%`,
        key: 'span',
        delete: true
      })
    }

    if (node.attribs['border-left'] !== undefined) {
      node.attribs.class += ' ui-col-border-left'
      delete node.attribs['border-left']
    }

    if (node.attribs['border-right'] !== undefined) {
      node.attribs.class += ' ui-col-border-right'
      delete node.attribs['border-right']
    }

    if (node.attribs.align) {
      node.attribs.class += ` ui-col-align-${node.attribs.align}`
      node.attribs.class += ` align-${node.attribs.align}`
      colContent.attribs.class += ` align-${node.attribs.align}`
      delete node.attribs.align
    }

    if (node.attribs['vertical-align']) {
      node.attribs.class += ` valign-${node.attribs['vertical-align']}`
      colContent.attribs.class += ` valign-${node.attribs['vertical-align']}`
      delete node.attribs['vertical-align']
    }

    if (node.attribs['content-direction']) {
      colContent.attribs.class += ` flex-${node.attribs['content-direction']}`
    }

    if (node.attribs['space-left']) {
      // node.attribs.style += `padding-left: ${node.attribs['space-left']}px;`
      // delete node.attribs['space-left']
      attrs.push({
        name: 'padding-left',
        value: `${node.attribs['space-left']}`,
        unit: 'px',
        key: 'space-left',
        delete: true
      })
    }

    if (node.attribs['space-right']) {
      // node.attribs.style += `padding-right: ${node.attribs['space-right']}px;`
      // delete node.attribs['space-right']
      attrs.push({
        name: 'padding-right',
        value: `${node.attribs['space-right']}`,
        unit: 'px',
        key: 'space-right',
        delete: true
      })
    }

    if (node.attribs['space']) {
      attrs.push({
        name: 'padding-left',
        value: `${node.attribs['space'] / 2}`,
        unit: 'px'
      })
      attrs.push({
        name: 'padding-right',
        value: `${node.attribs['space'] / 2}`,
        unit: 'px',
        key: 'space',
        delete: true
      })
      // node.attribs.style += `padding-left: ${node.attribs['space'] / 2}px; padding-right: ${node.attribs['space'] / 2}px;`
      // delete node.attribs['space']
    }

    if (node.attribs.width) {
      // node.attribs.style += `flex: 0 0 ${node.attribs.width}px;`
      // delete node.attribs.width
      attrs.push({
        name: 'flex',
        value: `0 0 ${node.attribs.width}`,
        unit: 'px',
        key: 'width',
        delete: true,
        valueTransFn: (value) => {
          value = value.replace('{{', '${').replace('}}', '}')
          return '`' + `${value}px` + '`'
        }
      })
    }

    if (node.parent.attribs.height) {
      colContent.attribs.style = `height: ${node.parent.attribs.height}px;`
    }

    node.children = [colContent]

    this.appendStyle(attrs)

    recurse(colContent.children, this.options)
  }
}

module.exports = ColParser