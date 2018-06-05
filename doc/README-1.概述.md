# 基本概念

## entry 和 output

### context(上下文)
context 是 webpack 编译时的基础目录, 入口起点 entry 会相对于此目录查找.

基础目录, 绝对路径, 用于从配置中解析入口起点(entry point)和 loader. 推荐在配置中传递一个值.

### entry
入口起点, 指示 webpack 应该使用哪些模块作为构建内部依赖图的开始, 用于 webpack 查找启动并构建 bundle.

单页应用(SPA): 一个入口起点, 多页应用(MPA): 多个入口起点.

entry 的类型对生成的 chunk 的命名有一定影响:
- String: 生成的 chunk 名为 main
- Array: 生成的 chunk 名为 main; 数组中的所有项, 最终会被打包成一项, 顺序为依次
- Object: 生成的 chunk 名为 key 值; 如果 key 是 'src/js/components' 形式的, 就会在对应的 output 路径下生成对应的路径

### output
- path: 打包后的输出路径, 是一个绝对路径
- filename: 此选项决定了每个输出 bundle 的名称. 这些 bundle 将写入到 output.path 选项指定的目录下
  - "[name].js": 使用 entry 名称
  - "bundle.js": 固定名称
  - "[name]-[hash].js": 每次构建唯一的 hash 生成
  - "[name]-[chunkhash].js": 基于每个 chunk 内容的 hash
  - hash 和 chunkhash 的长度可以通过 [hash:1(]（默认20) 来指定, 或者通过 output.hashDigestLength 来指定
- publicPath: 对于按需加载或者图片等外部静态资源, 该选项非常重要.
  - 静态资源最终访问路径 = output.publicPath + 资源 loader 或插件等配置路径
  - publicPath 设为相对路径时,是相对于 index.html 的路径, 比如 publicPath:"./dist/",JS 文件名为 bundle.js,按上面的公式,最终访问 JS 的路径为 ./dist/bundle.js, 这个路径同时也是 index.html 引用 bundle.js 的路径,既然要在 index.html 通过相对路径引用bundle.js,那么 index.html 的位置就决定了 publicPath 的配置, 所以这种情况一定要注意
  - publicPath 设为相对于协( url（//)或 http 地址(http://),比如publicPath:'http://wwww.xxx.com/static/',开发环境当然是不能这么干,使用这个的场景是将资源托管到CDN,比如公司的静态资源服务器等
  - publicPath 应该以 '/' 结尾,同时其他 loader 或插件的配置不要以 '/' 开头
  - webpack-dev-server 也会默认从 publicPath 为基准,使用它来决定在哪个目录下启用服务,来访问 webpack 输出的文件

### getEntries
既然如此, 那么在处理多页面时,我们一定希望可以自动获取到 entry, 所以需要定义 getEntries 函数
```js
const glob = require('glob')
const path = require('path')
function getEntries (extensions, options) {
  const res = {}
  const verbose = options.verbose
  extensions = extensions || ['.js']
  options = options || {}

  extensions.forEach(validExt => {
    const srcDir = path.resolve(__dirname, '../src')
    const files = glob.sync(srcDir + '/**/*' + validExt, options).filter(filepath => {
      const extension = path.extname(filepath)
      const basename = path.basename(filepath, validExt)

      // 后缀不相等
      if (extension !== validExt) return false
      // 文件名以 '_' 开头
      if (!options.noskip && basename[0] === '_') return false
      // 文件名包含 数字,  字母,  _ 以外的部分
      if (!basename.match(/[A-Za-z0-9]+$/)) return false
      // 文件内容以 /*not entry*/ 开始

      // 打开文件并读取, 将内容读到 buf 中的 0-13
      const buf = new Buffer(13)
      const fd = fs.openSync(filepath, 'r')
      fs.readSync(fd, buf, 0, 13)
      const directive = buf.toString()
      return directive !== '/*not entry*/'
    })

    const includes = options.includes ? options.includes.split(',') : null
    console.log('includes for ', extensions, includes)
    const excludes = options.includes ? options.excludes.split(',') : null
    console.log('excludes for ', extensions, excludes)

    files.forEach(filepath => {
      // 将绝对路径转换为相对于 srcDir 的相对路径
      // 方便根据 entry 生成 chunk 时, 路径保持一致
      const key = path.relative(options.baseDir || srcDir, filepath)
      key = key.replace(validExt, '')

      // 当 options 有 includes 和 excludes 选项时
      // 有 includes 选项, 那么必须声明在内
      // 有 excludes 选项, 如果在内就忽略
      if(includes) {
        if (includes.indexOf(key) < 0) return
      } else if (excludes) {
        if (excludes.indexOf(key) >= 0) return
      }

      res[key] = filepath

      if (verbose) {
        console.log(('Entries for ' + extensions.join(' and ')).cyan.bold)
        for (var k in res) {
          console.log(k.green, '=>\n  ', res[k].yellow)
        }
      }
      if (!Object.keys(res).length) {
        console.error('!!!Got no entry for ' + extensions + '!!!')
      }
      return res
    })
  })
}
```

> 这里我们要明确一点, 什么样的文件是 entry?
>> 以 js 为例, 只有通过 html 中的 script 访问的才算是 entry, 而其他都是 entry 的依赖.
>>> 约定文件内容以 /\*not entry\*/ 开头的不会作为 entry
>>> 约定文件名以 _ 开头的文件不会作为 entry
>>> 约定文件名包含数字, 字母和下划线以外元素的, 不会作为 entry

## loader
loader 是 module 的一个选项, 关于 module 选项之后再介绍, 此处单独介绍 loader, 那么 loader 有什么用呢?
webpack 是 JS 编写的, 所以它只认识 JS 代码, 那么想要通过 webpack 打包非 JS 代码时, 就要通过 loader 完成.

### JavaScript
虽然 webpack 认识 JS 代码, 但是希望我们的代码运行在浏览器环境, 那么还需要把 ES Next 版本的代码转换为 ES5 的代码, 这就需要额外的 loader.

先安装如下依赖:
```shell
$ npm install babel-loader babel-cli --save-dev
```

#### babel
此时执行 webpack 是没什么用的, 因为还没通过 .babelrc 文件指定编译成那个环境的, 所以新建 .babelrc 文件, 并添加如下代码:
```json
{
  "presets": ["es2015"]
}
```

再安装 babel-preset-es2015 作为依赖:
```shell
$ npm install babel-preset-es2015 --save-dev
```

现在执行 webpack 就会发现 es2015(es6) 的部分语法已经被转换为 es5 的语法了.

但是如果你现在的代码中使用了 ES6 之后的代码, 它是不会编译的, 比如 async await 它仍旧会保留.

目前有一个更通用的 babel-preset-env:
```shell
$ npm install babel-preset-env --save-dev
```

.babelrc
```json
{
  "presets": ["env"]
}
```
会编译任意版本的语言, 不管是 ES6 还是 ES7 甚至更高版本.

既然说到了 babel, 还有一点需要提一下, 虽然 babel 会帮助我们编译成 ES5 的代码, 但是它只是 shim 新的语法(如箭头函数, class 等), 并不会 shim 新的 API(如 Array.prototype.find), 所以想要使用新的 API 还要自己手动引入 babel-polyfill.

当然, 想要真正使用 async await 等语法, 光这样还是不够的, 还需要在 .babelrc 中添加其他选项:
```json
{
  "plugins": ["transform-regenerator"]
}
```

### CSS
webpack 无法打包 CSS 文件, 所以当在你的 js 文件直接 import 一个 .css 文件时, 会提示你需要一个 loader; 但是奇怪的是当 import 一个 stylus 文件时并不会报错, 而是把 stylus 文件的内容当做字符串直接读取进来(当然这并没有什么用, 因为浏览器不认识 stylus).

所以我们需要引入 loader:
```shell
$ npm install style-loader css-loader stylus stylus-loader --save-dev
```

然后在 webpack 配置中使用:
```js
{
  test: /\.css$/,
  loader: 'style-loader!css-loader'
}, {
  test: /\.styl$/,
  loader: 'style-loader!css-loader!stylus-loader'
}
```
- style-loader 会将 css-loader 解析的结果转变成 JS 代码, 以字符串插入的形式在 head 中插入 style 标签
- css-loader 用于加载 .css 文件, 处理 CSS 中的依赖, 例如 @import 和 url() 等引用外部文件的声明
- stylus-loader 用于加载 .styl 文件
- 注意: loader 的执行是有顺序的, 以上面的为例是从右到左执行,即通过 stylus-loader 读取 .styl 文件, 输出 .css 文件； 通过 css-loader 读取输出的 .css 文件, 得到 css 文件内容, 然后通过 style-loader 将读取到的内容插入到 head

除了上面的形式, 还可以通过数组的形式使用 loader:
```js
use: [
  { loader: 'style-loader' },
  { loader: 'css-loader' },
  { loader: 'stylus-loader' }
]
```

现在已经支持在 .js 文件中 import .styl 文件了

#### extract-text-webpack-plugin
经过上面的处理是不会生成额外的 CSS 文件的, 如果想要单独把 CSS 文件分离出来, 就需要 extract-text-webpack-plugin:
```shell
npm install extract-text-webpack-plugin --save-dev
```

配置如下:
```js
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        // 因为这个插件需要干涉模块转换的内容, 所以需要使用它对应的 loader
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'stylus-loader'],
        }),
      },
    ],
  },
  plugins: [
    // 引入插件, 配置文件名, 这里同样可以使用 [hash]
    new ExtractTextPlugin({
      filename: '[name]-[contenthash].css',
      allChunks: false
    })
  ],
}
```

### enforce 选项
思考一个问题, 当你有如下配置时, 会先使用哪个 loader 呢:
```js
rules: [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "eslint-loader",
  },
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "babel-loader",
  },
],
```
我们的目的当然是希望 eslint-loader 在 babel-loader 应用前执行(检查编写的代码), 这时候就需要通过 enforce 选项为 pre/post 来声明是 前置/后置(还有一种行内的方式, 但是不推荐)

```js
rules: [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "eslint-loader",
    enforce: "pre"
  },
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "babel-loader",
    enforce: "post"
  },
],
```

## plugin

### htmlWebpackPlugin
HtmlWebpackPlugin 简化了 HTML 文件的创建, 尤其是每次编译后文件名 hash 值都发生变化的情况尤其有用. 你可以让插件为你生成一个 HTML 文件或使用你自己的模板

这会产生一个 dist/index.html 文件, 如果你有多个 webpack 入口点, 他们都会在生成的 HTML 文件中的 script 标签内； 如果你有任何 CSS assets 在 webpack 的输出中（例如, 利用 ExtractTextPlugin(提取 CSS), 那么这些将被包含在 HTML head 中的 <link> 标签内.

该插件有如下常用属性:
- title: 生成的 HTML 文件的 title
- filename: 指定生成的文件的名字, 还可以通过 'xxx/xxx.html' 指定一个子路径, 该路径是相对于 output.publicPath 而言的
- template: 如果生成的 HTML 文件不符合你的需求, 可以通过该选项指定自定义的模板
- inject: 将所有资源注入到模板的指定位置
- favicon: 将指定 icon 的路径添加到生成的 HTML 文件
- meta: 注入 meta 标签: 如 "meta": {viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no'}
- minify: 将输出的 HTML 文件压缩
- hash: 给所有的 js 和 csss 文件添加 hash 值用于缓存
- cache: 只在修改文件后才会发布文件
- showErrors: 错误详情会被写入 HTML 页面
- chunks: 允许只添加某些块(比如,仅仅 unit test 块)
- chunksSortMode: 允许控制块在添加到页面之前的排序方式
- excludeChunks: 允许跳过某些块(如单元测试的)

#### template options
关于 template 选项还有几点需要说明, 模板支持模板类型
- 不设置任何 loader
```js
{
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ]
}
```
使用 .html 作为后缀而且不会使用任何 loader

- 直接给 template 使用指定 loader
```js
new HtmlWebpackPlugin({
  template: '!!handlebars!src/index.hbs'
})
```

- 使用 module.loaders 设置的 loader
```js
{
  module: {
    loaders: [
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader'
      },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.hbs'
    })
  ]
}
```

注意, 当你使用了 html-loader 时, 就为 .html 文件设置了 loader:
```js
{
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: 'html-loader'
      }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    })
  ]
}
```

并且如果想要产生多个 .html 文件, 那就需要这样配置:
```js
plugins: [
    // 生成两个 .html 文件
    new HtmlWebpackPlugin({
      filename: "index.html"
    }),
    new HtmlWebpackPlugin({
      filename: "main.html"
    })
  ]
```

#### events
通过事件来允许其他插件扩展/改变 HTML, 有兴趣请查看文档
- html-webpack-plugin-before-html-generation
- html-webpack-plugin-before-html-processing
- html-webpack-plugin-alter-asset-tags
- html-webpack-plugin-after-html-processing
- html-webpack-plugin-after-emit
- html-webpack-plugin-alter-chunks(同步事件)

