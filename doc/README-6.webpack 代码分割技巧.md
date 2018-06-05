# webpack 代码分割技巧

## 懒加载
webpack 支持在代码中定义分割点. 分割点指定的模块只有在真正使用时才加载, 可以使用 webpack 提供的 require.ensure 语法:
```js
$('#okButton').click(function(){
  require.ensure(['./foo'], function(require) {
    var foo = require('./foo');
    //your code here
  });
});

// 也可以像RequireJS一样使用AMD语法:
$('#okButton').click(function(){
  require(['foo'], function(foo){
    // your code here
  }]);
});
```
上面两种方式都会将以 foo 模块为入口将其依赖模块递归地打包到一个新的 Chunk, 并在 #okButton 按钮点击时才异步地加载这个以 foo 模块为入口的新的 chunk.

## 使用 CommonsChunkPlugin 分割代码
在理解 CommonsChunkPlugin 代码分割之前, 我们需要熟悉 webpack 中 chunk 的概念, webpack 将多个模块打包之后的代码集合称为 chunk. 根据不同 webpack 配置, chunk 又有如下几种类型:
- Entry Chunk: 包含一系列模块代码, 以及 webpack 的运行时(Runtime)代码【框架/库代码】, 一个页面只能有一个 Entry Chunk, 并且需要先于 Normal Chunk 载入
- Normal Chunk: 只包含一系列模块代码, 不包含运行时(Runtime)代码【非框架/库代码】.

作为 webpack 代码分割的利器, 网络上有太多 CommonsChunkPlugin 的文章, 但以某一使用场景的入门案例为主. 本文我们根据不同场景下的使用方法, 分别介绍.

### 提取库代码
假设我们需要将很少变化的常用库(react、lodash、redux)等与业务代码分割, 可以在webpack.config.js 采用如下配置:
```js
var webpack = require("webpack");
module.exports = {
  entry: {
    app: "./app.js",
    vendor: ["lodash","jquery"],
  },
  output: {
    path: "release",
    filename: "[name].[chunkhash].js"
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({names: ["vendor"]})
  ]
};
```

上述配置将常用库打包到一个 vender 命名的 Entry Chunk, 并将以 app.js 为入口的业务代码打包到 Normal Chunk. 其中 Entry Chunk 包含了 webpack 的运行时(Runtime)代码, 所以在页面中必须先于业务代码加载.

### 提取公有代码
假设我们有多个页面, 为了优化网络加载性能, 我们需要将多个页面共用的代码提取出来单独打包. 可以在 webpack.config.js 进行如下配置:
```js
var webpack = require("webpack");
module.exports = {
    entry: {
      page1: "./page1.js",
      page2: "./page2.js"
    },
    output: {
      filename: "[name].[chunkhash].js"
    },
    plugins: [ new webpack.optimize.CommonsChunkPlugin("common.[chunkhash].js") ]
}
```

上述配置将两个页面中通用的代码抽取出来并打包到以 common 命名的 Entry Chunk, 并将以 page1.js 和 page2.js 为入口代码分别打包到以 page1 和 page2 命名的 Normal Chunk. 其中 Entry Chunk 包含了 webpack 的运行时(Runtime)代码, 所以 common.[chunkhash].js 在两个页面中都必须在 page1.[chunkhash].js 和 page2.[chunkhash].js 前加载.

在这种配置下, CommonsChunkPlugin 的作用可以抽象: 将多个入口中的公有代码和 Runtime(运行时) 抽取到父节点

理解了CommonsChunkPlugin的本质后, 我们看一个更复杂的例子:
```js
var webpack = require("webpack");
module.exports = {
    entry: {
        p1: "./page1",
        p2: "./page2",
        p3: "./page3",
        ap1: "./admin/page1",
        ap2: "./admin/page2"
    },
    output: {
        filename: "[name].js"
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin("admin-commons.js", ["ap1", "ap2"]),
        new webpack.optimize.CommonsChunkPlugin("commons.js", ["p1", "p2", "admin-commons.js"])
    ]
};
```

我们可以用树结构描述上述配置的作用:
![](https://foio.github.io/images/common-chunk-tree.png)

每一次使用 CommonsChunkPlugin 都会将共有代码和 runtime 提取到父节点. 上述例子中, 通过两次 CommonChunkPlugin 的作用, runtime 被提取到 common.js 中. 通过这种树型结构, 我们可以清晰的看出每个页面对各个 chunk 的依赖顺序.

### 提取 Runtime(运行时) 代码
> 使用 CommonsChunkPlugins 时, 一个常见的问题就是:
>> 没有被修改过的公有代码或库代码打包出的 Entry Chunk, 会随着其他业务代码的变化而变化, 导致页面上的长缓存机制失效.

本意就是在只修改业务代码时, 而不改动库代码时, 打包出的库代码的 chunkhash 也发生变化, 导致浏览器端的长缓存机制失效.

这主要是因为使用 CommonsChunkPlugin 提取代码到新的 chunk 时, 会将 webpack 运行时(Runtime) 也提取到打包后的新的 chunk. 通过如下配置就可以将 webpack 的 runtime 单独提取出来:
```js
var webpack = require("webpack");
module.exports = {
  entry: {
    app: "./app.js",
    vendor: ["lodash","jquery"],
  },
  output: {
    path: 'release',
    filename: "[name].[chunkhash].js"
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({names: ['vendor','runtime']}),
  ]
};
```

这种情况下, 当业务代码发生变化, 而库代码没有改动时, vender 的 chunkhash 不会变, 这样才能最大化的利用浏览器的缓存机制. 修改业务代码后, vender 的 chunkhash 不会变化, 方便使用浏览器的缓存. 并且由于 webpack 的 runtime 比较小, 我们可以直接将该文件的内容 inline 到 html 中.

## 使用 DllPlugin 和 DllReferencePlugin 分割代码
通过 DllPlugin 和 DllReferencePlugin, webpack 引入了另外一种代码分割的方案.

我们可以将常用的库文件打包到 dll 包中, 然后在 webpack 配置中引用. 业务代码的可以像往常一样使用 require 引入依赖模块, 比如 require('react'), webpack 打包业务代码时会首先查找该模块是否已经包含在 dll 中了, 只有 dll 中没有该模块时, webpack 才将其打包到业务 chunk 中.

首先我们使用 DllPlugin 将常用的库打包在一起:
```js
var webpack = require('webpack');
module.exports = {
  entry: {
    vendor: ['lodash','react'],
  },
  output: {
    filename: '[name].[chunkhash].js',
    path: 'build/',
  },
  plugins: [new webpack.DllPlugin({
    name: '[name]_lib',
    path: './[name]-manifest.json',
  })]
};
```

该配置会产生两个文件, 模块库文件: vender.[chunkhash].js 和模块映射文件: vender-menifest.json. 其中 vender-menifest.json 标明了模块路径和模块 ID(由webpack产生)的映射关系, 其文件内容如下:
```js
{
  "name": "vendor_lib",
  "content": {
    "./node_modules/.npminstall/lodash/4.17.2/lodash/lodash.js": 1,
    "./node_modules/.npminstall/webpack/1.13.3/webpack/buildin/module.js": 2,
    "./node_modules/.npminstall/react/15.3.2/react/react.js": 3,
    ...
    }
}
```

在业务代码的 webpack 配置文件中使用 DllReferencePlugin 插件引用模块映射文件: vender-menifest.json 后, 我们可以正常的通过 require 引入依赖的模块, 如果在vender-menifest.json 中找到依赖模块的路径映射信息, webpack 会直接使用 dll 包中的该依赖模块, 否则将该依赖模块打包到业务 chunk 中.
```js
var webpack = require('webpack');
module.exports = {
  entry: {
    app: ['./app'],
  },
  output: {
    filename: '[name].[chunkhash].js',
    path: 'build/',
  },
  plugins: [new webpack.DllReferencePlugin({
    context: '.',
    manifest: require('./vendor-manifest.json'),
  })]
};
```

由于依赖的模块都在 dll 包中, 所以例子中 app 打包后的 chunk 很小.

需要注意的是: dll 包的代码是不会执行的, 需要在业务代码中通过 require 显示引入. 相比于 CommonChunkPlugin, 使用 DllReferencePlugin 分割代码有两个明显的好处:
- 由于 dll 包和业务 chunk 包是分开进行打包的, 每一次修改代码时只需要对业务 chunk 重新打包,  webpack 的编译速度得到极大的提升, 因此相比于 CommonChunkPlugin, DllPlugin 进行代码分割可以显著的提升开发效率.
- 使用 DllPlugin 进行代码分割, dll 包和业务 chunk 相互独立, 其 chunkhash 互不影响, dll 包很少变动, 因此可以更充分的利用浏览器的缓存系统. 而使用 CommonChunk 打包出的代码, 由于公有 chunk 中包含了 webpack 的 runtime(运行时), 公有 chunk 和业务 chunk 的 chunkhash 会互相影响, 必须将 runtime 单独提取出来, 才能对公有 chunk 充分地使用浏览器的缓存.

