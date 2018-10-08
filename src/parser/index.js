const _ = require('lodash')

const ParserFactory = require('./ParserFactory')

const parsers = {}

function parse (opts) {
  let name = opts.node.name
  if (name) {
    let parser = parsers[name]
    if (!parser) {
      parser = ParserFactory.create(opts)
    }
    parser.handleParse()
  }
}

function parseTags(nodes, opts) {
  nodes.forEach((node) => {
    parse(Object.assign({}, opts, { node: node }))
    // row和col的结构需要单独处理
    if (node.name === 'ui-row') {
      node.children.forEach((childNode) => {
        if (childNode.name === 'ui-col') {
          parse(Object.assign({}, opts, { node: childNode }))
        }
      })
    }

    if (node.children) {
      parseTags(node.children, opts)
    }
  })
}

module.exports = function (nodes, options) {
  let opts = _.merge({ recurse: parseTags }, options)
  parseTags(nodes, opts)
}