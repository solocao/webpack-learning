# webpack 流程

如果想要对 webpack 构建的整个流程进行 debug,  可以通过 webstorm 将 webpack-webstorm-debugger-script 中的 webstorm-debugger.js 置于 webpack.config.js 同一目录下, 搭建好脚手架后,  就尅直接 debug 这个 webstorm-debugger.js 文件了

再介绍一下 webpack 的核心概念
- loader：能转换各类资源, 并处理成对应模块的加载器. loader 间可以串行使用.
- chunk：code splitting 后的产物, 也就是按需加载的分块, 装载了不同的 module.

对于 module 和 chunk 的关系可以参照 webpack 官方的这张图：
![](https://img.alicdn.com/tps/TB1B0DXNXXXXXXdXFXXXXXXXXXX-368-522.jpg)

流程总览
![webpack 整体流程图](https://img.alicdn.com/tps/TB1GVGFNXXXXXaTapXXXXXXXXXX-4436-4244.jpg)

shell 与 config 解析
每次在命令行输入 webpack 后, 操作系统都会去调用 ./node_modules/.bin/webpack 这个 shell 脚本. 这个脚本会去调用 ./node_modules/webpack/bin/webpack.js 并追加输入的参数, 如 -p , -w

在 webpack.js 这个文件中 webpack 通过 optimist 将用户配置的 webpack.config.js 和 shell 脚本传过来的参数整合成 options 对象传到了下一个流程的控制对象中.

- optimist
和 commander 一样, optimist 实现了 node 命令行的解析, 其 API 调用非常方便.
```js
var optimist = require("optimist");

optimist
  .boolean("json").alias("json", "j").describe("json")
  .boolean("colors").alias("colors", "c").describe("colors")
  .boolean("watch").alias("watch", "w").describe("watch")
  ...
```
获取到后缀参数后, optimist 分析参数并以键值对的形式把参数对象保存在 optimist.argv 中, 来看看 argv 究竟有什么？
```js
// webpack --hot -w
{
  hot: true,
  profile: false,
  watch: true,
  ...
}
```

- config 合并与插件加载
在加载插件之前, webpack 将 webpack.config.js 中的各个配置项拷贝到 options 对象中, 并加载用户配置在 webpack.config.js 的 plugins . 接着 optimist.argv 会被传入到 ./node_modules/webpack/bin/convert-argv.js 中, 通过判断 argv 中参数的值决定是否去加载对应插件. (至于 webpack 插件运行机制, 在之后的运行机制篇会提到)
```js
ifBooleanArg("hot", function() {
  ensureArray(options, "plugins");
  var HotModuleReplacementPlugin = require("../lib/HotModuleReplacementPlugin");
  options.plugins.push(new HotModuleReplacementPlugin());
});
...
return options;
```
options 作为最后返回结果, 包含了之后构建阶段所需的重要信息.
```js
{
  entry: {},//入口配置
  output: {}, //输出配置
  plugins: [], //插件集合(配置文件 + shell指令)
  module: { loaders: [ [Object] ] }, //模块配置
  context: //工程路径
  ...
}
```
这和 webpack.config.js 的配置非常相似, 只是多了一些经 shell 传入的插件对象. 插件对象一初始化完毕,  options 也就传入到了下个流程中.
```js
var webpack = require("../lib/webpack.js");
var compiler = webpack(options);
```


参考
- [你的Tree-Shaking并没什么卵用](https://zhuanlan.zhihu.com/p/32831172)
- [Tree-Shaking性能优化实践 - 原理篇](https://juejin.im/post/5a4dc842518825698e7279a9)
- [Tree-Shaking性能优化实践 - 实践篇](https://juejin.im/post/5a4dca1d518825128654fa78)
- [细说 webpack 之流程篇](http://taobaofed.org/blog/2016/09/09/webpack-flow/)
- [happypack 原理解析](http://taobaofed.org/blog/2016/12/08/happypack-source-code-analysis/)
- [前端工程化：云构建](http://taobaofed.org/blog/2016/01/29/fe-engineering-width-cloud-build/)
- [webpack 多页应用配置](https://www.imooc.com/article/23643)
- [webpack代码分割技巧](https://foio.github.io/wepack-code-spliting/)
- [深入浅出 Webpack](http://webpack.wuhaolin.cn/)
- [webpack 源码解析](https://juejin.im/entry/576b7aeda633bd0064065c74)
- [详解Webpack2的那些路径](http://www.qinshenxue.com/article/20170315092242.html)
