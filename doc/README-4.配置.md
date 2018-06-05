# webpack-配置

## 其他配置

### mode(webpack 4.x)
通过该选项告知 webpack 使用相应模式的内置优化:
```js
{
  mode: 'production'
}
```
或通过从命令行传递参数:
```shell
$ webpack --mode=production
```

- development: 将 process.env.NODE_ENV 设置为 development, 启用 NamedChunksPlugin 和 NamedModulesPlugin
- production: 将 process.env.NODE_ENV 设置为 production, 启用 FlagDependencyUsagePlugin, FlagIncludedChunksPlugin, ModuleConcatenationPlugin, NoEmitOnErrorsPlugin, OccurrenceOrderPlugin, SideEffectsFlagPlugin 和 UglifyJsPlugin.

### module
module 选项决定了如何处理项目中的不同类型的模块
- noParse: 指定不需要解析的文件.
- rules: 创建模块时, 通过该数组匹配规则 Rule, 通过这些规则可以修改模块的创建方式以及对模块应用 loader, 或者修改解析器

#### Rule(规则)
规则分为三个部分:
- 条件(condition)
  有两种输入值
  - resource: 请求文件的绝对路径, 根据 resolve 选项解析
  - issuer: 用它来尝试约束某些类型的文件中只能引用某些类型的文件
  - 通过 test, include, exclude 和 resource 对 resource 进行匹配; issuer 对 issuer 进行匹配
- 结果(result)
  只在条件(condition)匹配时使用, 有两种输入值
  - 应用的 loader: 应用在 resource 上的 loader 数组
  - Parse 选项: 为模块创建解析器
- 嵌套规则(nested rule)
- 使用 rules 和 oneOf 指定嵌套规则

#### Rule 的选项
- exclude: 需要排序的模块
- include: 需要包含在内的模块
- issuer: 将 loader 应用到一个特定模块或一组模块的依赖中
- oneOf: 当规则匹配时, 只使用第一个匹配规则
```js
{
  test: /.css$/,
  oneOf: [
    {
      resourceQuery: /inline/, // foo.css?inline
      use: 'url-loader'
    },
    {
      resourceQuery: /external/, // foo.css?external
      use: 'file-loader'
    }
  ]
}
```
- options/query: loader 选项, 值可以传递到 loader 中
- parser: 解析选项对象. 所有应用的解析选项都将合并
- resource:
- resourceQuery:
- rules: 当规则匹配时使用
- test: 指定匹配类型
- use: 应用于模块的 UseEntries 列表. 每个入口(entry)指定使用一个 loader

#### module type
webpack 4.x 版本强化了 module type(模块类型), 不同的模块类型类似于配置了不同的 loader, webpack 会有针对性地进行处理

### resolve[解析]
webpack 依赖 enhanced-resolve 来解析代码模块的路径, webpack 配置文件中和 resolve 相关的选项都会传递给 enhanced-resolve 使用, 通过 resolve 选项设置模块如何被解析.

- alias: 创建 import 或 require 的别名, 确保模块的引入变得更简单
```js
{
  alisa: {
    '@': path.resolve(__dirname, '../src'),
    components: path.resolve(__dirname, '../src/components')
  }
}
```

- extensions: 用于自动解析确定的扩展.
```js
{
  extensions: ['.js', '.vue']
}
```

- mainFields: 当从 npm 包中导入当前模块时, 有一些第三方模块会针对不同环境提供几分代码. 例如分别提供采用 ES5 和 ES6 的2份代码,这2份代码的位置写在 package.json 中, 此选项将决定在 package.json 中使用哪个字段导入模块:
```js
{
  "jsnext:main": "es/index.js", // 采用 ES6 语法的代码入口文件
  "main": "lib/index.js" // 采用 ES5 语法的代码入口文件
}
```
webpack 会根据 resolve.mainFields 的配置决定优先采用哪份代码, 如 mainField: ["browser", "module", "main"]

- mainFiles: 解析目录时使用的文件; 当目录下没有 package.json 文件时, 我们说会默认使用目录下的 index.js 这个文件
- modules: 告诉 webpack 解析时应该搜索的目录, 默认 modules: ["node_modules"]

### target
通过该选项告诉 webpack 为构建目标指定一个环境, 默认 target: 'web' 指编译为类浏览器环境里可用

### watch
通过 webpack 监听文件变化, 在修改后重新编译

### watchOptions
用于定制 watch 模式的选项

- aggregateTimeout: 当第一个文件修改, 会在重新构建前增加延时； 这个选项允许 webpack 将这段时间内进行的任何其他更改都聚合到一次重新构建里.以毫秒为单位默认值 300
- ignored: 排除指定文件夹
- poll: 开启 polling(轮询)

### externals
提供了从输出的 bundle 中排除依赖的方法, 防止将某些包打包到 bundle 中, 而是在运行时(runtime) 再去从外部获取, 并且还可以指定在不同模块化方式下的引用问题:
```js
externals : {
  lodash : {
    commonjs: "lodash",
    amd: "lodash",
    root: "_" // 指向全局变量
  }
}
```

### devtool
此选项用于控制是否生成, 以及如何生成 source map, 可以通过 SourceMapDevToolPlugin 进行更细粒度的配置, 还可以通过 source-map-loader 查看已有的 source map

可以通过该选项来选择一种 source map 格式来增强调试过程. 注意不同的值会影响到构建(build)和重新构建(rebuild)的速度

可以通过 SourceMapDevToolPlugin/EvalSourceMapDevToolPlugin 代替 devtool 选项,  因为它们提供了更多的选项(注意不要同时使用, 因为 devtool 内部添加过这些插件)

具体的值请看官方文档, 其中一些值适用于生产环境, 一些值适用于开发环境. 开发环境通常需要更快速的 source map, 需要添加到 bundle 中以增加体积为代价; 对于生产环境, 则希望更精准的 source map, 需要从 bundle 中分离并独立存在. 另外可以通过 output.sourceMapFilename 自定义生成的 source map 的文件名

开发环境:
推荐使用 eval-source-map, 生成的文件可以映射到实际原始代码

生产环境:
- none: 即省略 devtool 选项, 不会生成 source map
- source-map: 整个 source map 作为一个单独的文件生成

webpack 的 source map 选项很多, 但是总结下来就是几个关键字:
- eval: 使用 eval 包裹模块代码, 通过 sourceURL 找到原始代码的位置. 使用 eval 会使得文件很大, 所以涉及该选项的不会在生产环境使用.
- source-map: 指生成 .map 文件
- cheap: 不包含列信息也不包含 loader 的 source map. 其实不包含列信息对开发调试也还可以接受
- module: 包含 loader 的 source map
- inline: 将 .map 作为 DataURL 嵌入, 而不生成 .map 文件

### performance
控制 webpack 如何通知「资源(asset)和入口起点超过指定文件限制」

### node
配置是否 polyfill 或 mock 某些 Nodejs 全局变量和模块

### stats(统计信息)
如果你不希望使用 quiet 或 noInfo 这样的不显示信息, 而是又不想得到全部的信息, 只是想要获取某部分 bundle 的信息, 使用 stats 选项是比较好的折衷方式. 【对于 webpack-dev-server, 这个属性要放在 devServer 对象里】

## 区分环境
在日常开发工作中, 一般需要两套构建环境:
- 开发环境: 构建结果用于本地开发时使用, 不进行代码的压缩, 打印 debug 信息, 包含 source map 文件
- 生产环境: 构建结果用于线上环境, 进行代码压缩, 不打印 debug 信息, 不需要 source map 文件

webpack 4.x 版本引入了 mode 的概念, 在运行 webpack 时需要指定使用 production 或 development 两个 mode 其中一个. 指定 production 后默认会启用各种性能优化的功能(包括构建结果优化以及 webpack 运行性能优化), 而 develpment 则会开启 debug 工具运行时打印详细的错误信息以及更加快速的增量编译构建.

但是有些 loader 还是需要自己手动区分环境来调整的. 所以我们还是尝试多份配置文件(多种配置类型)的方式

根据官方的文档的多种配置类型, 配置文件可以对外暴露一个函数作为导出一个配置对象的替代, 此函数接受 environment 作为参数.

webpack 4.x 的做法是当运行 webpack 时, 你可以通过 --env 指定构建环境的键, 例如 --env.production 或者 --env.platform=web.
```js
// webpack 4.x
module.exports = (env, argv) => ({
  // ... 其他配置
  optimization: {
    minimize: false,
    // 使用 argv 来获取 mode 参数的值
    minimizer: argv.mode === 'production' ? [
      new UglifyJsPlugin({ /* 你自己的配置 */ }),
      // 仅在我们要自定义压缩配置时才需要这么做
      // mode 为 production 时 webpack 会默认使用压缩 JS 的 plugin
    ] : [],
  },
})
```

那么 webpack 3.x 怎么做呢? 我们可以通过 Node.js 提供的机制给要运行的 webpack 程序传递环境变量, 来控制不同环境下的构建行为:
```json
// package.json
{
  "scripts": {
    "build": "NODE_ENV=production webpack",
    "develop": "NODE_ENV=development webpack-dev-server"
  }
}
```

然后在 webpack.config.js 文件中可以通过 process.env.NODE_ENV 来获取命令传入的环境变量:
```js
const config = {
  // ... webpack 配置
}

if (process.env.NODE_ENV === 'production') {
  // 生产环境需要做的事情, 如使用代码压缩插件等
  config.plugins.push(new UglifyJsPlugin())
}

module.exports = config
```

### 常见的配置环境差异
- 生产环境可能需要分离 CSS 成单独的文件, 以便多个页面共享同一个 CSS 文件
- 生产环境需要压缩 HTML/CSS/JS 代码
- 生产环境需要压缩图片
- 开发环境需要生成 source map 文件
- 开发环境需要打印 debug 信息
- 开发环境需要 hmr 功能

webpack 4.x 的 mode 已经提供了上述差异配置的大部分功能, mode 为 production 时默认使用 JS 代码压缩, 而 mode 为 development 时默认启用 hot reload, 等等. 这样让我们的配置更为简洁, 我们只需要针对特别使用的 loader 和 plugin 做区分配置就可以了.

我们可以把 webpack 的配置按照不同的环境拆分成多个文件, 运行时直接根据环境变量加载对应的配置即可. 基本的划分如下:
- webpack.base.js: 基础部分, 即多个文件中共享的配置
- webpack.development.js: 开发环境使用的配置
- webpack.production.js: 生产环境使用的配置
- webpack.test.js: 测试环境使用的配置

### webpack-merge
既然现在是多个文件(实际就是多个 js 对象), 那就需要有一个工具能比较智能地合并多个配置对象, 这样的话我们就可以轻松的拆分 webpack 配置, 然后通过判断环境变量, 使用工具将对应环境的多个配置对象整合后提供给 webpack 使用 --- 该工具为 [webpack-merge](https://github.com/survivejs/webpack-merge):
```js
// webpack.development.conf.js
const { smart } = require('webpack-merge')
const webpack = require('webpack')
const base = require('./webpack.base.js')

module.exports = smart(base, {
  module: {
    rules: [
      // 用 smart API, 当这里的匹配规则相同且 use 值都是数组时, smart 会识别后处理
      // 和上述 base 配置合并后, 这里会是 { test: /\.js$/, use: ['babel', 'coffee'] }
      // 如果这里 use 的值用的是字符串或者对象的话, 那么会替换掉原本的规则 use 的值
      {
        test: /\.js$/,
        use: ['coffee'],
      },
      // ...
    ],
  },
  plugins: [
    // plugins 这里的数组会和 base 中的 plugins 数组进行合并
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
})
```
这可以帮助我们更加轻松地处理 loader 配置的合并

## 使用其他语言配置 webpack
通过 [node-interpret](https://github.com/js-cli/js-interpret) 可以使 webpack 处理不同类型的文件

比如使用 typescript 配置 webpack, 先安装依赖 npm install --save-dev typescript ts-node @types/node @types/webpack, 之后就可以使用 typescript 进行配置了
