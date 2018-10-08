'use strict'

const path = require('path')
const fs = require('fs')
const merge = require('webpack-merge')
const utils = require('loader-utils')
const less = require('less')
const yaml = require('js-yaml')
const _ = require('lodash')

var webpack = require('webpack')

const scriptLoader = path.join(__dirname, './script-loader.js')
const styleLoader = path.join(__dirname, './style-loader.js')
const templateLoader = path.join(__dirname, './template-loader.js')
const jsLoader = path.join(__dirname, './js-loader.js')
const afterLessLoader = path.join(__dirname, './after-less-loader.js')
const beforeTemplateCompilerLoader = path.join(__dirname, './before-template-compiler-loader.js')

const projectRoot = process.cwd()

const getLessVariables = require('./libs/get-less-variables')
const configUtil = require('./libs/configUtil')


/**
 * Plugins
 */
const htmlBuildCallbackPlugin = require('../plugins/html-build-callback')
const DuplicateStyle = require('../plugins/duplicate-style')

let isWarnedThemeColor = false

/** build done callback **/

function DonePlugin(callbacks) {
  this.callbacks = callbacks || function () { }
  // Setup the plugin instance with options...
}

DonePlugin.prototype.apply = function (compiler) {
  let callbacks = this.callbacks
  compiler.plugin('done', function () {
    callbacks.forEach(function (fn) {
      fn()
    })
  })
}

/** emit plugin **/
function EmitPlugin(callback) {
  this.callback = callback
}

EmitPlugin.prototype.apply = function (compiler) {
  let callback = this.callback
  compiler.plugin('emit', function (compilation, cb) {
    callback(compilation, cb)
  })
}

module.exports = function (source) {
  const SCRIPT = utils.stringifyRequest(this, scriptLoader).replace(/"/g, '')
  const STYLE = utils.stringifyRequest(this, styleLoader).replace(/"/g, '')
  const AFTER_LESS_STYLE = utils.stringifyRequest(this, afterLessLoader).replace(/"/g, '')
  const TEMPLATE = utils.stringifyRequest(this, templateLoader).replace(/"/g, '')
  const BEFORE_TEMPLATE_COMPILER = utils.stringifyRequest(this, beforeTemplateCompilerLoader).replace(/"/g, '')

  var query = this.query ? utils.parseQuery(this.query) : {}
  this.cacheable()
  if (!source) return source
  const config = this.vux || utils.getLoaderConfig(this, 'touchui-pre')
  if (!config) {
    return source
  }

  let variables = ''

  // 暂不使用less-theme插件，使用app.json控制theme
  const appConfigPath = path.join(config.options.projectRoot, 'app.ui')

  if (fs.existsSync(appConfigPath)) {
    delete require.cache[appConfigPath]
    this.addDependency(appConfigPath)
    // 使用app.ui获取theme配置
    let appConfig = configUtil.getConfigObj(appConfigPath)
    variables = appConfig.theme

    if (!variables) {
      if (!isWarnedThemeColor) {
        console.warn('\x1b[33m%s\x1b[0m', '未设置主题色，将使用`#39f`作为主题色')
        isWarnedThemeColor = true
      }

      variables = { 'theme-color': '#3399ff' }
    }
  }

  source = addScriptLoader(source, SCRIPT)
  source = addStyleLoader(source, STYLE, variables, AFTER_LESS_STYLE)
  source = addTemplateLoader(source, TEMPLATE, BEFORE_TEMPLATE_COMPILER)

  return source
}

function hasPlugin(name, list) {
  const match = list.filter(function (one) {
    return one.name === name
  })
  return match.length > 0
}

function getFirstPlugin(name, list) {
  const match = list.filter(function (one) {
    return one.name === name
  })
  return match[0]
}

// merge touch-ui options and return new webpack config
module.exports.merge = function (oldConfig, uiConfig) {
  oldConfig = Object.assign({
    plugins: []
  }, oldConfig)

  let config = Object.assign({
    module: {},
    plugins: []
  }, oldConfig)

  if (!uiConfig) {
    uiConfig = {
      options: {},
      plugins: []
    }
  }

  if (!uiConfig.options) {
    uiConfig.options = {
      buildEnvs: ['production']
    }
  }

  const buildEnvs = uiConfig.options.buildEnvs || ['production']
  if (buildEnvs.indexOf(process.env.NODE_ENV) !== -1) {
    process.env.__TOUCHUI_BUILD__ = true
  } else {
    process.env.__TOUCHUI_BUILD__ = false
  }

  // if (process.env.__TOUCHUI_BUILD__ === false && (process.env.NODE_ENV !== 'production' && !process.env.VUE_ENV && !/build\/build/.test(process.argv) && !/webpack\.prod/.test(process.argv))) {
  //   require('./libs/report')
  // }

  if (!uiConfig.plugins) {
    uiConfig.plugins = []
  }

  if (uiConfig.plugins.length) {
    uiConfig.plugins = uiConfig.plugins.map(function (plugin) {
      if (typeof plugin === 'string') {
        return {
          name: plugin
        }
      }
      return plugin
    })
  }

  uiConfig.allPlugins = uiConfig.allPlugins || []

  // check multi plugin instance
  const pluginGroup = _.groupBy(uiConfig.plugins, function (plugin) {
    return plugin.name
  })
  for (let group in pluginGroup) {
    if (pluginGroup[group].length > 1) {
      throw (`only one instance is allowed. plugin name: ${group}`)
    }
  }

  // if exists old ui config, merge options and plugins list
  let oldUiConfig = oldConfig.vux || null

  oldConfig.plugins.forEach(function (plugin) {
    if (plugin.constructor.name === 'LoaderOptionsPlugin' && plugin.options.vux) {
      oldUiConfig = plugin.options.vux
    }
  })

  if (oldUiConfig) {
    // merge old options
    uiConfig.options = Object.assign(oldUiConfig.options, uiConfig.options)
    // merge old plugins list
    uiConfig.plugins.forEach(function (newPlugin) {
      let isSame = false
      oldUiConfig.allPlugins.forEach(function (oldPlugin, index) {
        if (newPlugin.name === oldPlugin.name) {
          oldUiConfig.allPlugins.splice(index, 1)
          oldUiConfig.allPlugins.push(newPlugin)
          isSame = true
        }
      })
      if (!isSame) {
        oldUiConfig.allPlugins.push(newPlugin)
      }
    })
    uiConfig.allPlugins = oldUiConfig.allPlugins
  } else {
    uiConfig.allPlugins = uiConfig.plugins
  }

  // filter plugins by env
  if (uiConfig.options.env && uiConfig.allPlugins.length) {
    uiConfig.plugins = uiConfig.allPlugins.filter(function (plugin) {
      return typeof plugin.envs === 'undefined' || (typeof plugin.envs === 'object' && plugin.envs.length && plugin.envs.indexOf(uiConfig.options.env) > -1)
    })
  }

  if (!uiConfig.options.projectRoot) {
    uiConfig.options.projectRoot = projectRoot
  }

  // check webpack version by module.loaders
  let isWebpack2 = true

  if (!isWebpack2) {
    if (!config.vue) {
      config.vue = {
        loaders: {
          i18n: 'touchui-pre-loader/src/noop-loader.js'
        }
      }
    } else {
      if (!config.vue.loaders) {
        config.vue.loaders = {}
      }
      config.vue.loaders.i18n = 'touchui-pre-loader/src/noop-loader.js'
    }
  }

  let loaderKey = 'rules'

  config.module[loaderKey] = config.module[loaderKey] || []

  const useTouchUI = hasPlugin('touch-ui', uiConfig.plugins)
  uiConfig.options.useTouchUI = true

  /**
   * ======== set touch-ui options ========
   */
  // for webpack@2.x, options should be provided with LoaderOptionsPlugin
  if (isWebpack2) {
    if (!config.plugins) {
      config.plugins = []
    }
    // delete old config for webpack2
    config.plugins.forEach(function (plugin, index) {
      if (plugin.constructor.name === 'LoaderOptionsPlugin' && plugin.options.vux) {
        config.plugins.splice(index, 1)
      }
    })
    config.plugins.push(new webpack.LoaderOptionsPlugin({
      vux: uiConfig
    }))
  }

  if (hasPlugin('inline-manifest', uiConfig.plugins)) {
    var InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin')
    config.plugins.push(new InlineManifestWebpackPlugin({
      name: 'webpackManifest'
    }))
  }

  if (hasPlugin('progress-bar', uiConfig.plugins)) {
    const ProgressBarPlugin = require('progress-bar-webpack-plugin')
    const pluginConfig = getFirstPlugin('progress-bar', uiConfig.plugins)
    config.plugins.push(new ProgressBarPlugin(pluginConfig.options || {}))
  }

  /**
   * ======== read vux locales and set globally ========
   */
  // if (hasPlugin('touch-ui', uiConfig.plugins)) {
  //   let vuxLocalesPath = path.resolve(uiConfig.options.projectRoot, 'node_modules/vux/src/locales/all.yml')
  //   if (uiConfig.options.uiDev) {
  //     vuxLocalesPath = path.resolve(uiConfig.options.projectRoot, 'src/locales/all.yml')
  //   }
  //   try {
  //     const vuxLocalesContent = fs.readFileSync(vuxLocalesPath, 'utf-8')
  //     let vuxLocalesJson = yaml.safeLoad(vuxLocalesContent)

  //     if (isWebpack2) {
  //       config.plugins.push(new webpack.LoaderOptionsPlugin({
  //         vuxLocales: vuxLocalesJson
  //       }))
  //     } else {
  //       config = merge(config, {
  //         vuxLocales: vuxLocalesJson
  //       })
  //     }
  //   } catch (e) {}
  // }

  /**
   * ======== append touchui-pre-loader ========
   */
  let loaderString = uiConfig.options.loaderString || 'touchui-pre-loader!vue-loader'
  const rewriteConfig = uiConfig.options.rewriteLoaderString
  if (typeof rewriteConfig === 'undefined' || rewriteConfig === true) {
    let hasAppendPreLoader = false
    config.module[loaderKey].forEach(function (rule) {
      const hasVueLoader = rule.use && _.isArray(rule.use) && rule.use.length && rule.use.filter(function (one) {
        return one.loader === 'vue-loader'
      }).length === 1
      if (rule.loader === 'vue' || rule.loader === 'vue-loader' || hasVueLoader) {
        if (!isWebpack2 || (isWebpack2 && !rule.options && !rule.query && !hasVueLoader)) {
          rule.loader = loaderString
        } else if (isWebpack2 && (rule.options || rule.query) && !hasVueLoader) {
          delete rule.loader
          rule.use = [
            'touchui-pre-loader',
            {
              loader: 'vue-loader',
              options: rule.options,
              query: rule.query
            }]
          delete rule.options
          delete rule.query
        } else if (isWebpack2 && hasVueLoader) {
          rule.use.unshift('touchui-pre-loader')
        }
        hasAppendPreLoader = true
      }

      // touchui处理
      if (rule.loader === 'touchui' || rule.loader === 'touchui-loader') {
        if (!isWebpack2 || (isWebpack2 && !rule.options && !rule.query)) {
          rule.loader = loaderString
        } else if (isWebpack2 && (rule.options || rule.query)) {
          delete rule.loader
          rule.use = [
            'touchui-pre-loader',
            {
              loader: 'touchui-loader',
              options: rule.options,
              query: rule.query
            }]
          delete rule.options
          delete rule.query
        }
        hasAppendPreLoader = true
      }
    })
    if (!hasAppendPreLoader) {
      config.module[loaderKey].push({
        test: /\.vue$/,
        loader: loaderString
      })
    }
  }

  /**
   * ======== append js-loader ========
   */
  config.module[loaderKey].forEach(function (rule) {
    if (rule.loader === 'babel' || rule.loader === 'babel-loader' || (/babel/.test(rule.loader) && !/!/.test(rule.loader))) {
      if (isWebpack2 && (rule.query || rule.options)) {
        let options
        if (rule.options) {
          options = rule.options
          delete rule.options
        } else {
          options = rule.query
          delete rule.query
        }
        rule.use = [jsLoader, {
          loader: 'babel-loader',
          options: options
        }]
        delete rule.loader
      } else {
        rule.loader = 'babel-loader!' + jsLoader
      }
    }
  })

  /**
   * ======== set compiling touch-ui js source ========
   */
  if (hasPlugin('touch-ui', uiConfig.plugins)) {
    if (typeof uiConfig.options.uiSetBabel === 'undefined' || uiConfig.options.uiSetBabel === true) {
      config.module[loaderKey].push(getBabelLoader(uiConfig.options.projectRoot))
    }
  }

  // set done plugin
  if (hasPlugin('build-done-callback', uiConfig.plugins)) {
    const callbacks = uiConfig.plugins.filter(function (one) {
      return one.name === 'build-done-callback'
    }).map(function (one) {
      return one.fn
    })
    config.plugins.push(new DonePlugin(callbacks))
  }

  // duplicate styles
  if (hasPlugin('duplicate-style', uiConfig.plugins)) {
    let plugin = getFirstPlugin('duplicate-style', uiConfig.plugins)
    let options = plugin.options || {}
    config.plugins.push(new DuplicateStyle(options))
  }

  if (hasPlugin('build-emit-callback', uiConfig.plugins)) {
    config.plugins = config.plugins || []
    const callbacks = uiConfig.plugins.filter(function (one) {
      return one.name === 'build-emit-callback'
    }).map(function (one) {
      return one.fn
    })
    if (callbacks.length) {
      config.plugins.push(new EmitPlugin(callbacks[0]))
    }
  }

  if (hasPlugin('html-build-callback', uiConfig.plugins)) {
    let pluginConfig = getFirstPlugin('html-build-callback', uiConfig.plugins)
    config.plugins.push(new htmlBuildCallbackPlugin(pluginConfig))
  }

  return config
}

const _addScriptLoader = function (content, SCRIPT) {
  // get script type
  if (/type=script/.test(content)) {
    // split loaders
    var loaders = content.split('!')
    loaders = loaders.map(function (item) {
      if (/type=script/.test(item)) {
        item = SCRIPT + '!' + item
      }
      return item
    }).join('!')
    content = loaders
  } else if (/require\("!!babel-loader/.test(content)) {
    content = content.replace('!!babel-loader!', `!!babel-loader!${SCRIPT}!`)
  }
  return content
}

function addScriptLoader(source, SCRIPT) {
  var rs = source
  if (rs.indexOf('import __vue_script__ from') === -1) {
    rs = rs.replace(/require\("(.*)"\)/g, function (content) {
      return _addScriptLoader(content, SCRIPT)
    })
  } else {
    // for vue-loader@13
    rs = rs.replace(/import\s__vue_script__\sfrom\s"(.*?)"/g, function (content) {
      return _addScriptLoader(content, SCRIPT)
    })
  }
  return rs
}

const _addTemplateLoader = function (content, TEMPLATE, BEFORE_TEMPLATE_COMPILER) {
  // get script type
  if (/type=template/.test(content)) {
    // split loaders
    var loaders = content.split('!')
    loaders = loaders.map(function (item) {
      if (/type=template/.test(item)) {
        item = TEMPLATE + '!' + item
      }
      if (item.indexOf('template-compiler/index') !== -1) {
        item = item + '!' + BEFORE_TEMPLATE_COMPILER
      }
      return item
    }).join('!')
    content = loaders
  }
  return content
}

function addTemplateLoader(source, TEMPLATE, BEFORE_TEMPLATE_COMPILER) {
  source = source.replace(/\\"/g, '__TOUCHUI__')
  var rs = source
  if (rs.indexOf('import __vue_template__ from') === -1) {
    rs = rs.replace(/require\("(.*)"\)/g, function (content) {
      return _addTemplateLoader(content, TEMPLATE, BEFORE_TEMPLATE_COMPILER)
    })
  } else {
    // for vue-loader@13
    rs = rs.replace(/import\s__vue_template__\sfrom\s"(.*?)"/g, function (content) {
      return _addTemplateLoader(content, TEMPLATE, BEFORE_TEMPLATE_COMPILER)
    })
  }

  rs = rs.replace(/__TOUCHUI__/g, '\\"')
  return rs
}

function addStyleLoader(source, STYLE, variables, AFTER_LESS_STYLE) {
  let rs = source.replace(/require\("(.*)"\)/g, function (content) {
    if (/type=style/.test(content)) {
      var loaders = content.split('!')
      loaders = loaders.map(function (item) {
        if (/type=style/.test(item)) {
          item = STYLE + '!' + item
        }
        if (/less-loader/.test(item)) {
          if (variables) {
            var params = {
              modifyVars: variables
            }
            if (/sourceMap/.test(item)) {
              params.sourceMap = true
            }
            params = JSON.stringify(params).replace(/"/g, "'")
            item = item.split('?')[0] + '?' + params
          }

          item = AFTER_LESS_STYLE + '!' + item
        }
        return item
      }).join('!')

      content = loaders
    }
    return content
  })
  return rs
}

/**
 * use babel so component's js can be compiled
 */
function getBabelLoader(projectRoot, name) {
  name = name || 'touchui-pre'
  if (!projectRoot) {
    projectRoot = path.resolve(__dirname, '../../../')
    if (/\.npm/.test(projectRoot)) {
      projectRoot = path.resolve(projectRoot, '../../../')
    }
  }

  const componentPath = fs.realpathSync(projectRoot + `/node_modules/${name}/`) // https://github.com/webpack/webpack/issues/1643
  const regex = new RegExp(`node_modules.*${name}.src.*?js$`)

  return {
    test: regex,
    loader: 'babel-loader',
    include: componentPath
  }
}

function setWebpackConfig(oriConfig, appendConfig, isWebpack2) {
  if (isWebpack2) {
    oriConfig.plugins.push(new webpack.LoaderOptionsPlugin(appendConfig))
  } else {
    oriConfig = merge(oriConfig, appendConfig)
  }
  return oriConfig
}

function getOnePlugin(name, plugins) {
  const matches = plugins.filter(function (one) {
    return one.name === name
  })
  return matches.length ? matches[0] : null
}