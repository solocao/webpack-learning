const config = require('./config')
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const CopyWebpackPlugin =  require('copy-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const HtmlReplacePlugin = require('html-replace-webpack-plugin')
const path = require('path')
const utils = require('./utils')

module.exports = merge(baseWebpackConfig, {
  devtool: '#source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(config.prod.env)
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      // sourceMap: config.prod.sourceMap
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new CopyWebpackPlugin([{
      from: path.resolve(__dirname, '../static'),
      to: path.resolve(__dirname, config.prod.assetsRoot, 'static'),
      ignore: ['.*']
    }]),
    new ManifestPlugin({
      fileName: 'manifest-img.json',
      basePath: config.prod.assetsPublicPath,
      filter (manifest, file) {
        return /\.(png|gif|jpg)$/.test(manifest.path)
      }
    }),
    new ManifestPlugin({
      fileName: 'manifest-js.json',
      basePath: config.prod.assetsPublicPath,
      filter (manifest, file) {
        return /\.js$/.test(manifest.path)
      }
    }),
    new ManifestPlugin({
      fileName: 'manifest-css.json',
      basePath: config.prod.assetsPublicPath,
      filter (manifest, file) {
        return /\.css$/.test(manifest.path)
      }
    }),
    new HtmlReplacePlugin([{
      pattern: /(src|href)=(\'\S+\'|\"\S+\")/g,
      replacement (match, $1, $2) {
        // return match.replace($2, manifest[$2])
        console.log(12131)
      }
    }])
  ]
})

