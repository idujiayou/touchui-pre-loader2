const tagList = require('./global-tag-list')

module.exports = function parseTransferDom(nodes, pageClass) {
  let node
  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i]
    if (node.type === 'tag') {
      if (tagList.indexOf(node.name) > -1) {
        node.attribs = node.attribs || {}
        if (node.attribs.class) {
          node.attribs.class += ` ${pageClass}`
        } else {
          node.attribs.class = pageClass
        }
      }
      if (node.children) {
        parseTransferDom(node.children, pageClass)
      }
    }
  }
}