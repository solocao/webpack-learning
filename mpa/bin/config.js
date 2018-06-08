const path = require('path')
const buildPath = '../build'

module.exports = {
  path: {
    buildPath: path.resolve(__dirname, buildPath),
    assetsPath: path.resolve(__dirname, '../src')
  },
  alias: {
    '@': path.resolve(__dirname, '../src'),
    'components': path.resolve(__dirname, '../src/js/components'),
    'api': path.resolve(__dirname, '../src/js/api'),
    'utils': path.resolve(__dirname, '../src/js/utils')
  },
  externals: {},
  dev: {
    env: 'development',
    port: 9090,
    host: 'localhost',
    open: false,
    proxyTable: {
      '/api': {
        target: "http://localhost:3000",
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    assetsRoot: path.resolve(__dirname, buildPath, 'dev'),
    assetsPublicPath: '/static/',
    devtool: '',
    sourceMap: '',
    notifyOnErrors: true
  },
  prod: {
    env: 'production',
    assetsRoot: path.resolve(__dirname, buildPath, 'prod'),
    assetsPublicPath: '/static/',
    devtool: '',
    sourceMap: true
  }
}
