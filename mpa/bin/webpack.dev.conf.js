const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WriteFilePlugin = require('write-file-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const config = require('./config')
const pkg = require('../package.json')
const path = require('path')
const portfinder = require('portfinder')

const devWebpackConfig = merge(baseWebpackConfig, {
  devtool: '#eval-source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  },
  devServer: {
    clientLogLevel: 'warning',
    port: config.dev.port,
    host: config.dev.host,
    compress: true,
    // historyApiFallback: true,
    hot: true,
    open: config.dev.open,
    overlay: {
      warnings: false,
      errors: true
    },
    publicPath: config.dev.assetsPublicPath,
    quiet: true,
    // watchOptions: {
    //   poll: 2000
    // },
    proxy: config.dev.proxyTable
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(config.dev.env)
    }),
    new FriendlyErrorsWebpackPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new WriteFilePlugin(),
    new CleanWebpackPlugin(['dev'], {
      root: config.path.buildPath
    }),
    new CopyWebpackPlugin([{
      context: path.join(config.path.assetsPath, 'css'),
      from: '**/*.css',
      to: path.resolve(config.dev.assetsRoot, './css')
    }, {
      from: path.resolve(config.path.assetsPath, './img'),
      to: path.resolve(config.dev.assetsRoot, './img')
    }, {
      from: path.resolve(config.path.assetsPath, './fonts'),
      to: path.resolve(config.dev.assetsRoot, './fonts')
    }])
  ]
})

module.exports = new Promise((resolve, rejext) => {
  portfinder.basePort = process.env.PORT || config.dev.port

  portfinder.getPort((err, port) => {
    if (err) reject(err)

    process.env.PORT = port
    devWebpackConfig.devServer.port = port

    devWebpackConfig.plugins.push(new FriendlyErrorsWebpackPlugin({
      compilationSuccessInfo: {
        messages: [`Your application is running here: http://${config.dev.host}:${port}`]
      },
      onErrors: config.dev.notifyOnErrors
        ? createNotifierCallback()
        : undefined,
    }))

    resolve(devWebpackConfig)
  })
})

function createNotifierCallback () {
  const notifier = require('node-notifier')

  return (severity, errors) => {
    if (severity !== 'error') {
      return
    }
    const error = errors[0]

    const filename = error.file && error.file.split('!').pop()
    notifier.notify({
      title: pkg.name,
      message: severity + ': ' + error.name,
      subtitle: filename || '',
      icon: path.join(__dirname, 'logo.png')
    })
  }
}
