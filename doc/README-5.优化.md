# webpack-优化

## 优化前端资源加载

### CSS Sprites
通过 webpack-spritesmith 或 sprite-webpack-plugin

### 图片压缩
通过 image-webpack-loader 对图片进行压缩后, 再通过 file-loader 进行加载

### 使用 DataURL
当文件小于指定的配置大小时, 可以通过 url-loader 将图片转换为 base64 编码的 DataURL:
```js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192, // 单位是 Byte, 当文件小于 8KB 时作为 DataURL 处理
            },
          },
        ],
      },
    ],
  },
}
```

### 代码压缩
我们都知道压缩 JS 代码时必不可少的功能, webpack 4.x 甚至都将该功能作为生产环境的内置功能了. 同样的压缩 HTML 和 CSS 文件同样重要

对于 HTML 文件 html-webpack-plugin 插件就可以帮助进行压缩, 该插件使用 html-minifier 事项 HTML 代码的压缩, 更多选项查看[文档](https://github.com/kangax/html-minifier)
```js
module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html', // 配置输出文件名和路径
      template: 'assets/index.html', // 配置文件模板
      minify: { // 压缩 HTML 的配置
        minifyCSS: true, // 压缩 HTML 中出现的 CSS 代码
        minifyJS: true // 压缩 HTML 中出现的 JS 代码
      }
    }),
  ],
}
```

CSS 代码通过 css-loader 就可以进行压缩:
```js
module.exports = {
  module: {
    rules: [
      // ...
      {
        test: /\.css/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              minimize: true, // 使用 css 的压缩功能
            },
          },
        ],
      },
    ],
  }
}
```
css-loader 是通过 cssnano 来实现代码压缩的, 更多选项请查看[文档](http://cssnano.co/)

### 分离代码文件(如何利用缓存以及实现按需加载)
之前说过, 分离 CSS 文件通过 extract-text-webpack-plugin 即可

那么为什么要把 CSS 文件分离出来而不是直接一起打包在 JS 中, 因为我们希望利用缓存

- webpack 3.x 使用 CommonsChunkPlugin 来实现代码分离
```js
module.exports = {
  // ...
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons", // 公共使用的 chunk 的名称
      filename: "commons.js", // 公共 chunk 的生成文件名
      minChunks: 3, // 公共的部分必须被 3 个 chunk 共享
    }),
  ],
}
```
chunk 在这里是构建的主干, 可以简单理解为一个入口对应一个 chunk.

以上插件配置在构建后会生成一个 commons.js 文件, 该文件就是代码中的公共部分. 上面的配置中 minChunks 字段为 3, 该字段的意思是当一个模块被 3 个以上的 chunk 依赖时, 这个模块就会被划分到 commons chunk 中去

- webpack 4.x 把相关的功能包放到了 optimize.splitChunks 中, 直接使用该配置实现代码分离
```js
module.exports = {
  // ... webpack 配置

  optimization: {
    splitChunks: {
      chunks: "all", // 所有的 chunks 代码公共的部分分离出来成为一个单独的文件
    },
  },
}
```

之前我们提到拆分文件是为了更好地利用缓存, 分离公共类库很大程度上是为了让多页面利用缓存, 从而减少下载的代码量, 同时, 也有代码变更时可以利用缓存减少下载代码量的好处. 建议将公共使用的第三方类库显式地配置为公共的部分, 而不是 webpack 自己去判断处理. 因为公共的第三方类库通常升级频率相对低一些, 这样可以避免因公共 chunk 的频繁变更而导致缓存失效

- webpack 3.x 显式配置公共类库
```js
module.exports = {
  entry: {
    vendor: ['react', 'react-redux'], // 指定公共使用的第三方类库
    app: './src/entry',
    // ...
  },
  // ...
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor' // 使用 vendor 入口作为公共部分
      filename: "vendor.js",
      minChunks: Infinity, // 这个配置会让 webpack 不再自动抽离公共模块
    }),
  ],
}
```
上述配置会生成一个名为 vendor.js 的共享代码文件, 里面包含了 React 和 React-Redux 库的代码, 可以提供给多个不同的入口代码使用. 这里的 minChunks 字段的配置, 我们使用了 Infinity, 可以理解为 webpack 不自动抽离公共模块. 如果这里和之前一样依旧设置为 3, 那么被 3 个以上的 chunk 依赖的模块会和 React, React-Redux 一同打包进 vendor, 这样就失去显式指定的意义了

- webpack 4.x 显式配置公共类库
```js
module.exports = {
  entry: {
    vendor: ["react", "lodash", "angular", ...], // 指定公共使用的第三方类库
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: "initial",
          test: "vendor",
          name: "vendor", // 使用 vendor 入口作为公共部分
          enforce: true,
        },
      },
    },
  },
  // ... 其他配置
}

// 或者
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /react|angluar|lodash/, // 直接使用 test 来做路径匹配
          chunks: "initial",
          name: "vendor",
          enforce: true,
        },
      },
    },
  },
}

// 或者
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: "initial",
          test: path.resolve(__dirname, "node_modules") // 路径在 node_modules 目录下的都作为公共部分
          name: "vendor", // 使用 vendor 入口作为公共部分
          enforce: true,
        },
      },
    },
  },
}
```

### 按需加载模块
当你的 Web 应用是单个页面, 并且极其复杂的时候, 你会发现有一些代码并不是每一个用户都需要用到的. 你可能希望将这一部分代码抽离出去, 仅当用户真正需要用到时才加载, 这个时候就需要用到 webpack 提供的一个优化功能 —— 按需加载代码模块.

要按需加载代码模块很简单, 遵循 ES 标准的动态加载语法 [dynamic-import](https://github.com/tc39/proposal-dynamic-import) 来编写代码即可, webpack 会自动处理使用该语法编写的模块:
```js
// import 作为一个方法使用, 传入模块名即可, 返回一个 promise 来获取模块暴露的对象
// 注释 webpackChunkName: "lodash" 可以用于指定 chunk 的名称, 在输出文件时有用
import(/* webpackChunkName: "lodash" */ 'lodash').then((_) => {
  console.log(_.lash([1, 2, 3])) // 打印 3
})
```

注意一下, 如果你使用了 Babel 的话, 还需要 Syntax Dynamic Import 这个 Babel 插件来处理 import() 这种语法

由于动态加载代码模块的语法依赖于 promise, 对于低版本的浏览器, 需要添加 promise 的 polyfill 后才能使用.

import 后面的注释 webpackChunkName: "lodash" 用于告知 webpack 所要动态加载模块的名称. 我们在 webpack 配置中添加一个 output.chunkFilename 的配置:
```js
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name].[hash:8].js',
  chunkFilename: '[name].[hash:8].js' // 指定分离出来的代码文件的名称
},
```
如果没有添加注释 webpackChunkName: "lodash" 以及 output.chunkFilename 配置, 那么分离出来的文件名称会以简单数字的方式标识, 不便于识别

#### Tree shaking
Tree Shaking 依赖于 ES6 模块系统中的[静态结构特性](http://exploringjs.com/es6/ch_modules.html#static-module-structure), 可以用来移除 JavaScript 上下文中未引用的代码, 删掉用不着的代码, 以此有效减少 JavaScript 文件的大小. webpack 中, 只有启动了 JS 代码的压缩功能(即使用 uglifyjs)时, 会进行 Tree Shaking 优化.

注意, 如果项目中使用了 babel, 还要把 babal 解析模块语法的功能关闭, 在 .babelrc 配置中增加 "modules": false 这个配置:
```js
{
  "presets": [["env", { "modules": false }]]
}
```

Tree Shaking 也不是总有效的, 详见 [你的Tree-Shaking并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)

##### SideEffects
这是一个 webpack 4.x 具备的特性, 我们拿 lodash 举个例子. lodash 是一个工具库, 提供了大量的对字符串, 数组, 对象等常见数据类型的处理函数, 但是有的时候我们只是使用了其中的几个函数, 全部函数的实现都打包到我们的应用代码中, 其实很浪费. webpack 的 sideEffects 可以帮助解决这个问题

在 package.json 文件中进行 sideEffects: false 这个声明, 当某个模块的 package.json 文件中有了这个声明之后, webpack 会认为这个模块没有任何副作用, 只是单纯用来对外暴露模块使用, 那么在打包的时候就会做一些额外的处理:
```js
// lodash es 版本
import { forEach, includes } from 'lodash-es'

forEach([1, 2], (item) => {
  console.log(item)
})

console.log(includes([1, 2, 3], 1))
```

由于 lodash-es 这个模块的 package.json 文件有 sideEffects: false 的声明, 所以 webpack 会将上述的代码转换为以下的代码去处理:
```js
import { default as forEach } from 'lodash-es/forEach'
import { default as includes } from 'lodash-es/includes'
```
最终 webpack 不会把 lodash-es 所有的代码内容打包进来, 只是打包了你用到的那两个方法, 这便是 sideEffects 的作用

但是实际 tree shaking 有些场景下是无效的， 请参考 [Tree-Shaking性能优化实践 - 原理篇](https://juejin.im/post/5a4dc842518825698e7279a9) [Tree-Shaking性能优化实践 - 实践篇](https://juejin.im/post/5a4dca1d518825128654fa78)和 [你的Tree-Shaking并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)

## 提升 webpack 的构建速度
随着时间推移个业务发展, 项目中的页面或代码又或者依赖的类库会越来越多, 这个时候 webpack 的构建时间就会越来越长, 所以接着我们就看看如何提高 webpack 的构建速度

### 让 webpack 少干点活
这其实是提升构建速度最本质的点了, 具体步骤如下:
- 减少 resolve 的解析: 让 webpack 在查询模块路径时尽可能快速地定位到需要的模块, 不做额外的查询工作
```js
resolve: {
  modules: [
    path.resolve(__dirname, 'node_modules'), // 使用绝对路径指定 node_modules, 不做过多查询
  ],

  // 删除不必要的后缀自动补全, 少了文件后缀的自动匹配, 即减少了文件路径查询的工作
  // 其他文件可以在编码时指定后缀, 如 import('./index.scss')
  extensions: [".js"],

  // 避免新增默认文件, 编码时使用详细的文件路径, 代码会更容易解读, 也有益于提高构建速度
  mainFiles: ['index'],
},
```

- 把 loader 应用的文件范围缩小: 尽可能把 loader 应用的文件范围缩小, 只在最少数必须的代码模块中去使用必要的 loader(例如 node_modules 目录下的其他依赖类库文件, 基本就是直接编译好可用的代码, 无须再经过 loader 处理了):
```js
rules: [
  {
    test: /\.jsx?/,
    include: [
      path.resolve(__dirname, 'src'),
      // 限定只在 src 目录下的 js/jsx 文件需要经 babel-loader 处理
      // 通常我们需要 loader 处理的文件都是存放在 src 目录
    ],
    use: 'babel-loader',
  },
  // ...
],
```
- 减少 plugin 的消耗: plugin 会在构建过程中加入其它步骤, 如果可以一定要移除掉一些没有必要的 plugin
- 换种方式处理图片: 之前提过用 image-webpack-loader 来压缩图片, 但是这种方式对 webpack 的构建速度影响挺大的; 所以提供另一种解决思路 --- 使用 [imagemin](https://github.com/imagemin/imagemin-cli) 进行图片压缩, 然后通过 pre-commit 这个类库配置对应的命令, 使在 [git commit](https://github.com/observing/pre-commit) 的时候触发, 并把将要提交的文件替换为压缩后的
- 使用 DLLPlugin: 这是 webpack 官方提供的插件, 用于分离代码(和 webpack 3.x 的 CommonsChunkPlugin 或 webpack4.x 的 optimization.splitChunks 类似), 但是把它作为构建性能优化的部分是因为它的配置很繁琐, 所以如果不涉及构建性能优化就尽量使用其他的
- webpack 4.x 的构建性能: webpack 4.x 做了很多提升构建性能的优化, 比较重要的有如下几个方面:
  - AST 可以直接从 loader 直接传递给 webpack, 避免额外的解析
  - 使用速度更快的 md4 作为默认的 hash 方法
  - Node 语言层面的优化, 如用 for of 替换 forEach, 用 Map 和 Set 替换普通的对象字面量等等
  - 默认开启 uglifyjs-webpack-plugin 的 cache 和 parallel, 即缓存和并行处理, 这样能大大提高 production mode 下压缩代码的速度
- 最后再次强调一下 webpack 4.x 的 mode, 区分 mode 会让 webpack 的构建更加有针对性, 更加高效. 例如当 mode 为 development 时, webpack 会避免使用一些提高应用代码加载性能的配置项, 如 UglifyJsPlugin, ExtractTextPlugin 等, 这样可以更快地启动开发环境的服务, 而当 mode 为 production 时, webpack 会避免使用一些便于 debug 的配置, 来提升构建时的速度, 例如极其消耗性能的 Source Maps 支持
- 换个角度, 当我们需要去考虑 webpack 的构建性能问题时，往往面对的是项目过大，涉及的代码模块过多的情况。在这种场景下你单独做某一个点的优化其实很难看出效果, 可以尝试拆分项目的代码
