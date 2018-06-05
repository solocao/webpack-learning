# webpack 常用 loader 和 plugin

## 常用 loader

### babel-loader
通过 webpack 和 babel 编译 JavaScript 代码, 会读取根路径下的 .babelrc 作为配置选项, 具体配置请见 babel 官网.

### eslint-loader
对代码规范进行校验, 和 babel-loader 同时使用时注意顺序, eslint-loader 必然是希望先于 babel-loader 执行的:
```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        enforce: "pre",
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
  },
  // ...
}
```

并且还会去读取项目根路径下的 .eslintrc 作为配置选项, 以下为 vue-cli 中的 .eslintrc 配置
```js
// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  // https://github.com/standard/standard/blob/master/docs/RULES-en.md
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  'rules': {
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
  }
}
```
具体配置请见 eslint 官网.

### style-loader
通过 DOM 操作的方式, 将 CSS 插入到 style 标签

### css-loader
将 .css 文件中的 @import 和 url 像 import/require 一样解析

### stylus-loader
解析 .styl 文件, 将其编译为 .css 文件

### less-loader
解析 .less 文件, 将其编译为 .css 文件

### scss-loader
解析 .scss 文件, 将其编译为 .css 文件

### vue-loader
解析 .vue 单文件组件, 将其解析为 js 对象, 具体配置项请见 vue-loader 文档.

### html-loader
将 html 文件以字符串输出, 并且还可以进行压缩.

该 loader 或默认处理 html 中的 img:src
```html
<img src="img.png">
<!-- 处理为 require("img.png") -->
```
所以需要为 image 文件指定 loader 如: url-loader 或 file-loader

除此之外, 还可以指定哪些标签的属性应该被处理:
```js
{
  test: /\.(html)$/,
  use: {
    loader: 'html-loader',
    options: {
      attrs: ['img:data-src'] // 处理 img 标签的 data-src 属性
    }
  }
}
```
总的来说想要 webpack 处理图片路径, html-loader 是必须的

### raw-loader
将指定文件类型以字符串形式返回

### file-loader
前端项目中总会用到图片, 之前提过 css-loader 会解析样式中使用 url() 应用的文件路径, 但是 webpack 是不会处理 .jpg/.png/.gif 等文件格式的; 所以需要添加一个处理图片的 loader: file-loader

file-loader 可以处理多种类型的文件(不仅仅是图片), 它的主要作用是直接输出文件, 把构建后的文件路径返回
```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {},
          },
        ],
      },
    ],
  },
}
```

### url-loader
功能和 file-loader 类似, 但是在文件大小小于指定值时, 可以返回一个 dataUrl:
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192
            }
          }
        ]
      }
    ]
  }
}
```

### imports-loader 和 exports-loader
主要用于处理非模块化的情况

### 总结
总的来说 loader 是比较容易理解的, 它就是用来对各种类型的文件进行操作(编译、 导入...)

## 常用 Plugin
plugin 是 webpack 的支柱功能, webpack 自身也是构建于插件系统之上的. plugin 的目的是解决 loader 无法实现的问题.

更多插件请移步 [plugins in awesome-webpack](https://github.com/webpack-contrib/awesome-webpack#webpack-plugins)

### CommonsChunkPlugin
这是一个很常用的插件并且是 webpack 的内置插件, 通过 webpack.optimize.CommonsChunkPlugin 即可访问, 用于建立独立的文件(chunk).

将公共模块拆分, 合成的文件最先加载, 便于缓存. 详细配置请见官网. 使用案例请参考[]() []()

该插件还有一个功能 --- 提取模板

在每次修改后的构建中将 webpack 样板和 manifest 提取出来
```js
new webpack.optimize.CommonsChunkPlugin({
  name: 'manifest',
  minChunks: Infinity
})
```
这回生成一个 manifest-xxxx.js 文件, 该文件提取了 webpack 的 runtime 代码, 所以该文件需要最先加载的. 为什么这么做呢? 因为你改了 app.js 会导致 runtime 里的路径改变, 而 vendor 中的代码时大概率不变的代码那么就需要将它缓存. 所以将每次有限的变动放到 manifest-xxx.js 中, 保证 vendor-xxx.js 尽量不变来有效的利用缓存. 所以该功能和提取 vendor 文件要同时使用才有效

> 注: webpack 4.x 版本已经将该插件替换为 optimization.splitChunks 和 optimization.runtimeChunk

### DefinePlugin
DefinePlugin 是 webpack 的内置插件, 可以通过 webpack.DefinePlugin 直接获取

该插件用于创建一些在编译时可以配置的全局常量, 这些常量的值我们可以在 webpack 的配置中指定:
```js
module.exports = {
  // ...
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true), // const PRODUCTION = true
      VERSION: JSON.stringify('5fa3b9'), // const VERSION = '5fa3b9'
      BROWSER_SUPPORTS_HTML5: true, // const BROWSER_SUPPORTS_HTML5 = 'true'
      TWO: '1+1', // const TWO = 1 + 1,
      CONSTANTS: {
        APP_VERSION: JSON.stringify('1.1.2') // const CONSTANTS = { APP_VERSION: '1.1.2' }
      }
    }),
  ],
}
```

有了上面的配置, 你就可以在代码中访问这些变量了:
```js
console.log("Running App version " + VERSION)

if(!BROWSER_SUPPORTS_HTML5) require("html5shiv")
```
这对不同环境的构建是非常有用的

### ProvidePlugin
ProvidePlugin 也是一个 webpack 内置的插件, 我们可以直接使用 webpack.ProvidePlugin 来获取

该插件用于引用某些模块作为应用运行时的变量, 从而不必每次 require/import, 使用方法如下:
```js
new webpack.ProvidePlugin({
  identifier: 'module',
  // ...
})
// 或者
new webpack.ProvidePlugin({
  identifier: ['module', 'property'], // 即引用 module 下的 property, 类似 import { property } from 'module'
  // ...
})

new webpack.ProvidePlugin({
  $: 'jquery',
  jQuery: 'jquery'
})
// in a module
$('#item'); // <= 起作用
jQuery('#item'); // <= 起作用
// $ 自动被设置为 "jquery" 输出的内容
```

### IgnorePlugin
IgnorePlugin 也是一个 webpack 内置的插件, 我们可以直
接使用 webpack.IgnorePlugin 来获取

该插件和 ProvidePlugin 相反, 用于忽略某些特定的模块, 让 webpack 不把这些指定的模块打包进去. 例如我们使用 moment.js, 直接引用后, 里边有大量的 i18n 的代码, 导致最后打包出来的文件比较大, 而实际场景并不需要这些 i18n 的代码, 这时我们可以使用 IgnorePlugin 来忽略掉这些代码文件, 配置如下:
```js
module.exports = {
  // ...
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ]
}
```
IgnorePlugin 配置的参数有两个, 第一个是匹配引入模块路径的正则表达式, 第二个是匹配模块的对应上下文, 即所在目录名.

### copy-webpack-plugin
这个插件是用来复制文件/路劲的.

我们一般会把开发的所有源码和资源文件放在 src/ 目录下, 构建的时候产出一个 build/ 目录, 通常会直接拿 build 中的所有文件来发布. 有些文件没经过 webpack 处理, 但是我们希望它们也能出现在 build 目录下, 这时就可以使用 CopyWebpackPlugin 来处理:
```js
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/file.txt', to: 'build/file.txt', }, // 顾名思义, from 配置来源, to 配置目标路径
      { from: 'src/*.ico', to: 'build/*.ico' }, // 配置项可以使用 glob
      // 可以配置很多项复制规则
    ]),
  ],
}
```
这些配置项可以使用[node-glob](https://github.com/isaacs/node-glob#glob-primer), 这个库强烈推荐去了解一下

### html-webpack-plugin
该插件简化了 HTML 文件的创建, 对于文件名中包含每次会随着编译而发生变化哈希的 webpack bundle 尤其有用, 使用案例见 [1.webpack 概述]()

### extract-text-webpack-plugin
将所有入口 chunk 中引用的指定文件, 分离到独立的文件中. 这是个很有意思的插件, 它即提供了 plugin, 又提供了 loader, 使用案例见 [1.webpack 概述]()

> 注: 使用时请注意要使用 contenthash, 因为当 css 文件被 js 引用时, webpack 中所有内容都视为 js 的一部分, 而构建时 entry chunk 本身如果未发生变化, 那么即使 css 变化也无法检测, 此时就需要使用 contenthash

### NamedChunksPlugin
这是 webpack 的内置插件, 通过 webpack.NamedChunksPlugin 即可获取. 该插件在 webpack 4.x 开发环境下默认启动

webpack 会为每个模块分配一个 module id(从 0 开始递增), 构建时默认使用该 id 代表模块引用, 如果代码中去除或添加了依赖, 那么就会导致该 id 发生变化从而导致缓存失效.

想要生成稳定的 module id 可以通过:
- 1.CommonsChunkPlugin
- 2.HashedModuleIdsPlugin

但是还有另一种方法就是使用 chunk id, 即根据文件名来生成 chunk id, 这就需要使用 NamedChunksPlugin.

使用模块名称作为 chunk id, 替换掉原本的使用递增 id 来实现缓存, 推荐在生产环境使用该 plugin.

### NamedModulesPlugin
启动 HMR 时可以显示模块的相对路径, 建议在开发环境使用. 该插件在 webpack 4.x 开发环境下默认启动

### HashedModuleIdsPlugin
该插件会根据模块的相对路径生成一个四位数的 hash 作为模块的 id, 建议在生产环境使用

### FriendlyErrorsWebpackPlugin
帮助能够更好在终端看到 webapck 运行的警告和错误

### WebpackManifestPlugin
该插件会生成一个 json 文件, 可以显示出编译之前的文件和编译之后的文件的映射

### FlagDependencyUsagePlugin

### FlagIncludedChunksPlugin

### ModuleConcatenationPlugin
使用作用域提升(Scope Hoisting), 如果不使用该插件, webpack 会将每个模块单独打包成一个闭包, 这会使得打包后的 js 代码在浏览器中运行相对较慢. 该插件在 webpack 4.x 生产环境下默认启动

### NoEmitOnErrorsPlugin
在编译出现错误时, 使用 NoEmitOnErrorsPlugin 来跳过输出阶段. 这样可以确保输出资源不会包含错误. 对于所有资源, 统计资料(stat)的 emitted 标识都是 false. 该插件在 webpack 4.x 生产环境默认启动

### OccurrenceOrderPlugin
据模块调用次数, 给模块分配ids, 常被调用的 ids 分配更短的 id, 使得 ids 可预测, 降低文件大小, 该模块推荐使用. 该插件在 webpack 4.x 生产环境默认开启

### SideEffectsFlagPlugin

### uglifyjs-webpack-plugin
这是 webpack 的内置插件, 通过 webpack.optimize.UglifyJsPlugin 即可访问

这个插件自然不用多说了, 而且 tree shaking 功能也由该插件完成. 该插件在 webpack 4.x 生产环境默认开启

### DllPlugin & DllReferencePlugin
这两个是 webpack 的内置插件, 通过 webpack.DllPlugin 和 webpack.DllReferencePlugin 即可访问.

该插件通过某种方法实现了拆分 bundles, 并且大幅提升了构建速度

#### DllPlugin
该插件需要在额外的独立的 webpack 配置中指定 dll-only-bundle, 然后生成一个名为 manifest.json 的文件, 用来让 DLLReferencePlugin 映射到相关的依赖上去的.

#### DllReferencePlugin
把只有 dll-only-bundle 引用到需要预编译的依赖

由于这两个插件使用起来有些繁琐, 所以尽量不使用吧

### HotModuleReplacementPlugin
这是 webpack 的内置插件, 通过 webpack.HotModuleReplacementPlugin 即可访问. 切勿在生产环境开启
如果已经通过 HotModuleReplacementPlugin 启用了模块热替换(Hot Module Replacement), 则它的接口将被暴露在 module.hot 属性下面. 通常, 用户先要检查这个接口是否可访问, 然后再开始使用它. 举个例子, 你可以这样 accept 一个更新的模块:
```js
if (module.hot) {
  module.hot.accept('./library.js', function() {
    // 使用更新过的 library 模块执行某些操作...
  })
}
```

支持以下方法:
- accept: 接受(accept)给定依赖模块的更新, 并触发一个 回调函数 来对这些更新做出响应
- decline: 拒绝给定依赖模块的更新, 使用 'decline' 方法强制更新失败.
- dispose（或 addDispos(Handler): 添加一个处理函数, 在当前模块代码被替换时执行. 此函数应该用于移除你声明或创建的任何持久资源. 如果要将状态传入到更新过的模块, 请添加给定 data 参数. 更新后, 此对象在更新之后可通过 module.hot.data 调用.
- removeDisposeHandler: 添加一个处理函数, 在当前模块代码被替换时执行. 此函数应该用于移除你声明或创建的任何持久资源. 如果要将状态传入到更新过的模块, 请添加给定 data 参数. 更新后, 此对象在更新之后可通过 module.hot.data 调用.
- status: 取得模块热替换进程的当前状态.
- check: 测试所有加载的模块以进行更新, 如果有更新, 则应用它们.
- apply: 继续更新进程（只要 module.hot.status() ===('ready').
- addStatusHandler: 注册一个函数来监听 status的变化.
- removeStatusHandler: 移除一个注册的状态处理函数.

### optimize-css-assets-webpack-plugin
将 css 代码压缩优化(如转换为简写形式):
```css
div {
  border-width: 1px;
  border-style: solid;
  border-color: red;
}

/* 转换为简写 */
div {
  border: 1px solid red;
}
```

### compression-webpack-plugin
打包后的代码提供 gzip 版本, 提供带 Content-Encoding 编码的压缩版的资源

### webpack-bundle-analyzer
分析 Webpack 生成的包体组成并且以可视化的方式反馈给开发者
