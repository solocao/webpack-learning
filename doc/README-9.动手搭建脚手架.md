# 动手搭建 webpack 脚手架
介绍完了之前的部分, 差不多就可以手动搭建一套自己的构建工具了, 所以接着就一步一步从头搭建(webpack 3.x)

## 整体配置项
先看一下我们整体的配置项:
```js
{
  entry: {},
  context: {},
  output: {},
  devtool: {},
  watch: {},
  watchOptions: {},
  devServer: {},
  resolve: {},
  externals: {},
  module: {},
  plugins: [],
  stats: {}
}
```

这些配置项中, 大部分是要区分环境的, 所以我们需要抽离成三分: webpack.base.conf.js, webpack.dev.conf.js 以及 webpack.prod.conf.js.

安装依赖, 应为有些依赖需要安装特定版本, 否则就报错了, 就不在这些事情上花费太多精力了:
```shell
$ npm install webpack@3.6.0 webpack-dev-server@2.9.1 webpack-merge babel-core babel-loader babel-plugin-transform-runtime babel-preset-env babel-preset-stage-2 style-loader css-loader stylus stylus-loader less less-loader scss scss-loader jade jade-loader url-loader file-loader vue-loader@13.7.2 vue-template-compiler friendly-errors-webpack-plugin html-webpack-plugin --save-dev
```

## 单页应用脚手架
从简单的开始, 我们先搭建一个单页的脚手架

### webpack.base.conf.js
先看一下 webpack.base.conf.js:
```js
const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/js/index.js',
  context: path.resolve(__dirname, '../'),
  output: {
    path: path.resolve(__dirname, '../build'),
    filename: '[name].js',
    publicPath: '/static/'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      'components': path.resolve(__dirname, '../src/components'),
      'api': path.resolve(__dirname, '../src/api'),
      'utils': path.resolve(__dirname, '../src/utils')
    },
    extensions: ['.js']
  },
  externals: {
    'vue': 'Vue'
  },
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
    }, {
      test: /\.styl$/,
      loader: 'style-loader!css-loader!stylus-loader',
    }, {
      test: /\.less$/,
      loader: 'style-loader!css-loader!less-loader',
    }, {
      test: /\.scss$/,
      loader: 'style-loader!css-loader!scss-loader'
    }, {
      test: /\.(woff2?|eot|ttf|otf|png|jpe?g|gif|svg|mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)$/,
      loader: 'url-loader'
    }, {
      test: /\.jade/,
      loader: 'jade-loader'
    }]
  },
  plugins: []
}
```
这里再要强调几点:
- output.publicPath: 这是一个非常重要的选项, 对于访问外部静态资源的最终地址 = output.publicPath + 路径, 并且该路径一定要以 '/' 结尾.
- 有些 loader 不同环境下的配置选项不同, 之后会抽离出去
- babel-loader 的 cacheDirectory 指定的路径用于缓存 loader 的执行结果, 避免每次重新编译

好的 webpack.base.conf.js 大致就完成了

### webpack.dev.conf.js
开发环境需要 devServer, hmr, 开启 source map 等对开发友好的插件和配置
```js
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = merge(baseWebpackConfig, {
  devtool: '#eval-source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  },
  devServer: {
    clientLogLevel: 'warning',
    port: 10086,
    host: 'localhost',
    compress: true,
    historyApiFallback: true,
    hot: true,
    open: true,
    errorOverlay: {
      warnings: false,
      errors: true
    },
    publicPath: '/static/',
    quiet: true,
    watchOptions: {
      poll: false
    },
    proxy: {
      '/api': {
        target: "http://localhost:3000",
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': 'development'
    }),
    new FriendlyErrorsWebpackPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
  ]
})
```

### webpack.prod.conf.js
```js
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = merge(baseWebpackConfig, {
  devtool: '#inline-source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': 'production'
    }),
    new HtmlWebpackPlugin({
      filename: path.resolve(__dirname, '../build/index.html'),
      template: 'index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'dependency'
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ]
})
```

在 package.json 中的 scripts 中添加: "start": "webpack-dev-server --inline --progress --config bin/webpack.dev.conf.js", 好的现在 npm start 应该可以访问到了, 注意 devServer 的 publicPath 为 /static/ 所以现在要通过 http://localhost:10086/static 才可以正确访问

在 package.json 中的 scripts 中添加 "build": "webpack --config bin/webpack.prod.conf.js", 执行 npm run build 就可以在 build 文件夹中看到 index.html, app.js 以及 app.js.map 这几个文件了

### 通过搭建 node 服务模拟线上环境
现在已经可以构建生产环境了, 那么我们怎么模拟线上环境呢?

很简单, 使用 Express 搭建一个简单的 node 服务即可模拟了, 非常简单直接贴代码了:
```js
const express = require('express')
const app = express()
const path = require('path')
const router = require('express').Router()

router.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, './build/index.html'))
})

app.use('/static', express.static(path.resolve(__dirname, './build')))

app.use(router)

app.listen(10010, _ => {
  console.log('server started!')
})
```

### 问题
所以大致上功能算是完成了, 但是还有很多问题:
- 需要将开发环境和生产环境下的路径以配置的方式抽取到配置文件, 方便修改
- 通过 process.env.NODE_ENV 变量定义环境
- 有些 loader 和 plugin 在不同环境下, 配置是不同的, 所以应该同样通过配置或函数调用的方式来获取配置
- 开发环境
  - 当前端口如果被占用了怎么办
- 生产环境
  - 打包前需要先将之前打包的路径清空
  - 打包后的文件应该在统一的一个路径下更好, 因为 build 路径下还有 tmp 文件夹
  - 生成的文件名没有 hash 值, 那么当文件内容需要修改时就会因为缓存而出现问题
  - 公共文件没有分离到单独的文件中, 无法有效利用缓存
  - css 等文件未分离到单独的文件
  - img 等静态资源怎么办
  - 生成 manifest.json 的 sitemap 文件

### 抽离部分配置
```js
// config.js
const path = require('path')
const buildPath = '../build'

module.exports = {
  alias: {
    '@': path.resolve(__dirname, '../src'),
    'components': path.resolve(__dirname, '../src/js/components'),
    'api': path.resolve(__dirname, '../src/js/api'),
    'utils': path.resolve(__dirname, '../src/js/utils')
  },
  externals: {},
  dev: {
    env: 'development',
    port: 8086,
    proxyTable: {
      '/api': {
        target: "http://localhost:3000",
        pathRewrite: {
          '^/api': ''
        }
      }
    },
    assetsRoot: path.resolve(__dirname, buildPath, 'dev'),
    assetsPublicPath: '/',
    devtool: '',
    sourceMap: '',
    notifyOnErrors: true
  },
  prod: {
    env: 'production',
    assetsRoot: path.resolve(__dirname, buildPath, 'prod'),
    assetsPublicPath: '/',
    devtool: '',
    sourceMap: true
  }
}
```

现在的 webpack.base.conf.js 文件如下:
```js
const path = require('path')
const webpack = require('webpack')
const config = require('./config.js')

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
      ? '[name]-[chunkhash].js'
      : '[name].js',
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
    }, {
      test: /\.css$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? 'style-loader!css-loader?minimize=true'
        : 'style-loader!css-loader',
    }, {
      test: /\.styl$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? 'style-loader!css-loader?minimize=true!stylus-loader'
        : 'style-loader!css-loader!stylus-loader',
    }, {
      test: /\.less$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? 'style-loader!css-loader?minimize=true!less-loader'
        : 'style-loader!css-loader!less-loader'
    }, {
      test: /\.scss$/,
      loader: process.env.NODE_ENV === config.prod.env
        ? 'style-loader!css-loader?minimize=true!scss-loader'
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
```

webpack.dev.conf.js
```js
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const config = require('./config')

module.exports = merge(baseWebpackConfig, {
  devtool: '#eval-source-map',
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  },
  devServer: {
    clientLogLevel: 'warning',
    port: 9096,
    host: 'localhost',
    compress: true,
    // historyApiFallback: true,
    hot: true,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    publicPath: config.dev.assetsPublicPath,
    quiet: true,
    watchOptions: {
      poll: false
    },
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
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
  ]
})
```

webpack.prod.conf.js
```js
const config = require('./config')
// 注意, 一定要在 webpackConfig 之前
process.env.NODE_ENV = config.prod.env

const webpack = require('webpack')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf.js')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = merge(baseWebpackConfig, {
  devtool: '#source-map',
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(config.prod.env)
    }),
    new HtmlWebpackPlugin({
      filename: path.resolve(config.prod.assetsRoot, 'index.html'),
      template: 'index.html',
      inject: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'dependency'
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: config.prod.sourceMap
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ]
})
```

### 优化开发环境
开发环境如果当前端口已经被占用了, 可以自动寻找其他端口就极好了. 幸好有一个库叫 portfinder:
```shell
$ npm install portfinder node-notifier --save-dev
```
它会从 8000(默认, 否则为 portfinder.basePort) 开始向上搜索空闲的端口. 所以改造一下 webpack.dev.conf.js:
```js
// 之前的配置项
const devWebpackConfig = {...}

const portfinder = require('portfinder')

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
      onErrors: devWebpackConfig.dev.notifyOnErrors
        ? createNotifierCallback()
        : undefined,
    }))

    resolve(devWebpackConfig)
  })
})

function createNotifierCallback = function () {
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
```

### 优化生产环境
生产环境有很多优化的地方, 一条一条解决
```shell
$ npm install clean-webpack-plugin --save-dev
```

#### 打包前需要先将之前打包的路径清空
由于原先打包后的文件都是加上了 chunkhash, 所以再次打包后并不会覆盖这些文件还是存在, 所以需要每次构建前手动清理

可以通过 clean-webpack-plugin 插件来完成该工作:
```js
const CleanWebpackPlugin = require('clean-webpack-plugin')

new CleanWebpackPlugin(['prod'], {
  root: path.resolve(__dirname, '../build')
})
```
这样就会每次清理 build/prod 文件夹了

另外还有一种方式, vue-cli 就是采用的这种方式:
```shell
$ npm install ora chalk rimraf --save-dev
```

```js
const rm = require('rimraf')
const webpack = require('webpack')
const webpackConfig = require('./webpack.prod.conf.js')

const chalk = require('chalk')
// loading 效果
const ora = require('ora')
const spinner = ora('building for production...')

spinner.start()

rm(config.prod.assetsRoot, err => {
  if (err) throw err

  webpack(webpackConfig, function (err, stats) {
    spinner.stop()

    if (err) throw err

    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }

    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
```

#### 公共文件没有分离到单独的文件中, 无法有效利用缓存
```js
[
new webpack.optimize.CommonsChunkPlugin({
  name: 'vendor',
  minChunks: function (module) {
    return (module.resource && /\.js/.test(module.resource) && module.resource.indexOf(path.join(__dirname, '../node_modules'))) === 0
  }
}),
new webpack.optimize.CommonsChunkPlugin({
  name: 'manifest',
  minChunks: Infinity
}),
new webpack.optimize.CommonsChunkPlugin({
  name: 'app',
  async: 'vendor-async',
  children: true,
  minChunks: 3
})
]
```

#### css 等文件未分离到单独的文件
想要将 css 等文件分离到单独的文件中, 这就需要用到 extract-text-webpack-plugin:
```shell
$ npm install extract-text-webpack-plugin --save-dev
```

该插件即要在 loader 中使用, 还要在 plugin 中使用:
```js
const ExtractTextPlugin = require('extract-text-webpack-plugin')

{
  module: {
    rules: [
      ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: 'css-loader?minimize=true!stylus-loader'
      }),
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          extractCSS: process.env.NODE_ENV === config.prod.env ? true : false
        }
      }
    ]
  },
  plugins: [new ExtractTextPlugin({
    filename: 'css/[name]-[contenthash].css',
    allChunks: false
  })]
}
```

#### img, fonts 等静态资源怎么办
其实这部分资源我们已经通过 loader 处理好了, 只是由于 output.publicPath 等路径会觉得有点晕.

在使用这部分资源时, 就认为是当前工作目录就可以, webpack 打包是在当前工作目录中进行然后再替换为真正的路径的. 所以只要相对当前工作目录的路径是可以正确找到所引用的静态资源的话, 那么就可以正确打包

现在这个脚手架已经可以用于本地开发以及线上部署了, 当然还有不足之处, 最大的问题就是只支持单页面应用, 所以接着我们将其升级到支持多页应用.

## 升级到多页面脚手架
什么是多页面应用? --- 一个项目有不止一个 html 文件.

那么目前的脚手架升级到支持多页应用会遇到哪些问题?
- 有多个 html 文件就会有多个入口文件, 每次增加一个 html 文件经常就意味着至少增加一个入口文件(除非是无 js 的页面, 这几乎不可能)
- css 文件如果是在 html 文件中引入的, 而我们编写的是 stylus, scss 或 less 等预处理器文件, 那该怎么将这些文件在不通过 js 中引入的情况下, 自动编译为最终的 css 文件?
- 以及最终如何将线上与开发环境统一, 因为多页面应用需要给每个页面定义路由, 那么 devServer 肯定是不合适的, 需要我们使用 Express 等 node 库来启动服务, 这也就意味着可以通过 jade 等模板作为 view, 通过 Express 渲染来完成

HtmlWebpackPlugin 是可以用来生成多个 html 文件的:
```js
// 生成两个 html 文件
{
  plugin: [
    new HtmlWebpackPlugin({
      filename: xxx,
      template: xxx,
      chunks: [...],
      ...
    }),
    new HtmlWebpackPlugin({
      filename: xxx,
      template: xxx,
      chunks: [...],
      ...
    })
  ]
}
```

我们当然不可能每次都在配置文件中修改, 我们希望它可以动态的加载, 而我们负责写模板. 所以在 src 下新建 html 路径用于写 html 模板, 而在配置中去动态读取这些模板:
```js
// webpack.base.conf.js
{
  entry: utils.getEntries(['.js'])
}

// getEntries 函数之前介绍过, 详见 https:// 1.
let htmls = utils.getEntries(['.html'])

for (let page in htmls) {
  webpackConfig.plugins.push(new HtmlWebpackPlugin({
    filename: path.resolve(config.prod.assetsRoot, page + '.html'),
    template: htmls[page],
    inject: true,
    // minify: {
    //   removeComments: true,
    //   collapseWhitespace: true,
    //   removeAttributeQuotes: true
    // },
    // chunksSortMode: 'dependency',
    chunks: [page.replace('html/', ''), 'vendor', 'manifest']
  }))
}

...
```
采用上面这样的方式会遇到很多问题:
- 从上面的代码可以看出 js 和 html 的名字是相关联的, 这就不灵活. 如果写在 html 中的 script:src 可以被动态替换为打包后的路径就比较理想了.
- 并且之前单页的时候, entry 只有一个. 而现在是多页的, 通过 html-webpack-plugin 读取模板生成页面会将 entry 中所有的 js 都读取进来, 这显然不是我们想要的, 所以我们需要抛弃 html-webpack-plugin 了.(主要问题是不知道哪个 entry 是哪个 html 中引用的)
- 既然不使用 html-webpack-plugin 了, 那么通过 extract-text-webpack-plugin 生成的额外 css 文件的引用也就成为了问题. 而且就算可以使用, css 文件被每个 html 引用的问题也会存在.
- 之前通过 CommonsChunkPlugin 分割代码的方式也不适用了, 因为多页面中每个页面引用的库可能是不同的. 我们希望每个页面都可以通过主动引用的方式去引入相应的库.(虽然主要的库不太可能变动, 但是如果有需要变动的常景到时候就需要修改配置, 显然不希望这么做)

目标有了, 接着就是实现. html-replace-webpack-plugin 和 webpack-manifest-plugin 非常适合的插件, html-replace-webpack-plugin 可以帮助替换匹配的内容(我们可以通过该插件替换 html 中的 img:src, link:href 以及 script:src 等链接), webpack-manifest-plugin 可以提供打包前后对应文件的映射关系.
```shell
$ npm install write-file-webpack-plugin html-replace-webpack-plugin manifest-webpack-plugin --save-dev

$ npm uninstall html-webpack-plugin
```
> PS: 不再使用的 plugins 部分的代码请自行删除

最终解决方案如下:
- 1.通过 copy-webpack-plugin 将 html 代码直接 copy 到 build/prod/html 中或者提供 getEntires() 函数获取所有 .html 代码作为入口(需要 html-loader)
- 2.通过 getEntries() 获取所有 .css 文件作为入口并通过 loader 进行打包编译. 这样最终在浏览器打开后样式文件来源分为两个部分: 通过 html 引入的 css 以及通过 js 动态插入的 css. 这样主要是单独的样式文件就会变编译, 并且公共的样式文件还可以被缓存非常有效
- 3.通过 manifest-webpack-plugin 插件生成 manifest-js, manifest-css 以及 manifest-img 这几个映射文件, 然后通过 html-replace-webpack-plugin 插件替换编译前的路径

### 开发环境
我们从以 .js 作为入口一步步进行. 现在执行 npm start 由于没有 html 文件, 所以无法在浏览器看到任何信息(但是像 js 这样会被 webpack 打包的文件, 是可以在 /static/js/xxx.js 路径下访问到的, 因为 webpack-dev-server 不会产生真正的文件而是输出到内存中). 所以开发环境下我们也将 src/html/ 文件夹直接 copy 到 build/dev/ 下, 因为可能在 html 中直接引入 css 和 img等静态资源, 所以 src/css/ 和 src/img/ 也一并 copy.

由于 webpack-dev-server 和 copy-webpack-plugin 同事使用时 copy-webpack-plugin 会失效, 需要和 write-file-webpack-plugin 同时使用才行, 所以还要添加该插件.

### 生产环境
先解决多个 html 文件以及 html 文件引用的静态资源的问题. 通过 copy-webpack-plugin 和 write-file-webpack-plugin 插件将 src/html/, src/css/, src/fonts/ 以及 src/img/ 这些资源文件 copy 到 build/dev/ 下:
```js
// webpack.base.conf.js
{
  ...,
  plugins: [
    new CopyWebpackPlugin([{
      from: path.resolve(config.path.assetsPath, './html'),
      to: path.resolve(config[env].assetsRoot, './html')
    }])
  ]
}

// webpack.dev.conf.js
{
  ...,
  plugins: [
    ...,
    new WriteFilePlugin(),
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
}
```

现在通过 npm start 就可以启动服务了, 访问 http://localhost:9090/static/html/hello.html 就可以访问到页面了. 现在通过 webpack-dev-server 启动的服务就相当于是一个静态资源服务器, 所以 http://localhost:9090/static/html/test.html 就又可以访问到其他的页面了

注意: html 文件中的 css, js 以及 img 等文件, 想要访问到就要使用 /static/ 作为静态资源路径(这和 webpack-dev-server 的 publicPath 有关)

目前而言, .styl 文件还是只能在 .js 文件引用后才进行编译. 所以我们再写一份配置 webpack 入口配置, 将 .styl 作为入口文件, 通过 extract-text-webpack-plugin 将 styl 文件编译产生 css 文件, 但是引用时请注意, 需要在 html 中写的是编译后的文件名(即 .css 后缀)【还需要注意同一路径戏不要出现 .css 文件和 .styl 文件同名的情况】. 而且直接 copy src/css/ 也不合适, 因为其中的 .styl 文件也会被 copy 到 build/dev/.

```js
// webpack.base.config
const stylusConfig = {
  target: 'web',
  context: path.resolve(__dirname, '../'),
  entry: utils.getEntries(['.styl']),
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  output: {
    path: config[env].assetsRoot,
    filename: process.env.NODE_ENV === config.prod.env
      ? '[name]-[chunkhash].css'
      : '[name].css',
    publicPath: config.dev.assetsPath
  },
  module: {
    rules: [{
      test: /\.styl$/,
      loader: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: process.env.NODE_ENV === config.prod.env
        ? 'css-loader?minimize=true!stylus-loader'
        : 'css-loader!stylus-loader',
      })
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
    }]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: process.env.NODE_ENV === config.prod.env
        ? '[name]-[chunkhash].css'
        : '[name].css',
      allChunks: false
    })
  ]
}

webpack(stylusConfig, _ => {
  console.log('\n recompiling... \n')
})
```

好的到这里开发环境已经搭建完成, 可以正常使用了. 需要注意的是同一路径下 css 文件和 .styl 不要相同, 否则会互相覆盖(置于谁覆盖谁, 自己试试吧). 另外, 启动服务后创建/删除的 js 文件和 css/styl 文件都不会被动态的编译或删除(即创建的不会立马编译, 删除后的会报错), 这样的问题重启服务来解决吧.

## 检查版本
vue-cli 中有 check-versions.js 文件
