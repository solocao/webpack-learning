const path = require('path')
const webpack = require('webpack')
const config = require('./config.js')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: {
    app: './src/js/index.js'
  },
  output: {
    path: process.env.NODE_ENV === config.prod.env
      ? config.prod.assetsRoot
      : config.dev.assetsRoot,
    filename: process.env.NODE_ENV === config.prod.env
      ? 'js/[name]-[chunkhash].js'
      : 'js/[name].js',
    publicPath: process.env.NODE_ENV === config.prod.env
      ? config.prod.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    alias: config.alias,
    extensions: ['.js']
  },
  externals: config.externals,
  module: {
    rules: [{
      test: /.jsx?$/,
      loader: 'babel-loader',
      include: path.resolve(__dirname, '../src'),
      exclude: /node_modules/,
      query: {
        cacheDirectory: path.resolve(__dirname, '../build/tmp')
      }
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        extractCSS: process.env.NODE_ENV === config.prod.env ? true : false
      }
    }, {
      test: /\.css$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?minimize=true'
        })
        : 'style-loader!css-loader',
    }, {
      test: /\.styl$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?minimize=true!stylus-loader'
        })
        : 'style-loader!css-loader!stylus-loader',
    }, {
      test: /\.less$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?minimize=true!less-loader'
        })
        : 'style-loader!css-loader!less-loader'
    }, {
      test: /\.scss$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader?minimize=true!scss-loader'
        })
        : 'style-loader!css-loader!scss-loader'
    }, {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: process.env.NODE_ENV === config.prod.env
          ? 'img/[name]-[hash:7].[ext]'
          : 'img/[name].[ext]'
      }
    }, {
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: process.env.NODE_ENV === config.prod.env
          ? 'media/[name]-[hash:7].[ext]'
          : 'media/[name].[ext]'
      }
    }, {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: process.env.NODE_ENV === config.prod.env
        ? 'fonts/[name]-[hash:7].[ext]'
        : 'fonts/[name].[ext]'
      }
    }, {
      test: /\.jade$/,
      loader: 'jade-loader'
    }]
  },
  plugins: [

  ]
}
