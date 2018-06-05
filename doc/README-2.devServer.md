# webpack-devServer

## devServer
介绍完 JS 和 CSS 相关的 loader 以及 plugin 后, 介绍一下 devServer, 因为这和本地服务启动有关

### webpack-dev-server
webpack-dev-server 能够用于快速开发应用程序

安装 webpack-dev-server:
```shell
$ npm install webpack-dev-server --save-dev
```

安装后就可以在 webpack 配置文件的目录启动了:
```shell
webpack-dev-server --mode development
```

- compress: boolean. 表示服务是否启用 gzip 压缩
- historyApiFallback: 在使用 HTML5 History API(单页)时, 任意的 404 可能需要被替代为 index.html, 通过
```js
historyApiFallback: true
```

就可以启用该功能, 并且通过传入一个对象:
```js
historyApiFallback: {
  rewrites: [
    { from: /^\/$/, to: '/views/landing.html' },
    { from: /^\/subpage/, to: '/views/subpage.html' },
    { from: /./, to: '/views/404.html' }
  ]
}
```
还可以进一步的控制这种行为.

- port: 请求监听的端口号
- host: 指定使用一个 host, 默认 localhost
- public: 用于指定静态服务的域名, 默认是 http://localhost:8080/ , 当你使用 Nginx 来做反向代理时, 应该就需要使用该配置来指定 Nginx 配置使用的服务域名.
- hot: 表示启用 HMR
- open: 启动服务自动在浏览器打开
- openPage: 在浏览器打开指定页面
- overlay: 当有错误或警告时在最上方展示一个图层:
```js
{
  warnings: false,
  errors: true
}
```
- proxy: 详见下方
- progress: 将运行输出到控制台, 通过如下方式启用:
```shell
$ webpack-dev-server --progress
```
- publicPath: 此路径下的打包文件可在浏览器中访问. 【确保 publicPath 总是以斜杠(/)开头和结尾】
> 假设服务器运行在 http://localhost:8080 并且 output.filename 被设置为 bundle.js.默认 publicPath 是 "/",所以你的包(bundle)可以通过 http://localhost:8080/bundle.js 访问. 可以修改 publicPath,将 bundle 放在一个目录:  publicPath: "/assets/", 你的包现在可以通过 http://localhost:8080/assets/bundle.js 访问.
注意, 该 publicPath 与 output.publicPath 区别很大: 该 publicPath 是用于开发环境的, 这个路径仅仅是提供浏览器访问打包资源的功能; webpack 中的 loader 和 plugin 仍然读取 output.publicPath, 所以推荐**该 publicPath 和 output.publicPath 保持一致**保证正确访问静态资源
- quiet: 除了初始启动信息之外的任何内容都不会被打印到控制台. 当使用 FriendlyErrorsPlugin(推荐使用该 plugin) 时, 该选项必须为 true
- watchOptions: 监视文件的变动
```js
watchOptions: {
  poll: false
}
```

#### proxy
代理是我们开发时几乎必须的, 所以需要详细介绍.

前后端分离场景并希望在同域名下发送 API 请求, 代理就变得非常重要. dev-server 使用了非常强大的 http-proxy-middleware 包, 更详细的使用方式请见 [http-proxy-middleware](https://github.com/chimurai/http-proxy-middleware), 下面是基本使用方式:
```js
proxy: {
  "/api": {
    // api 服务地址
    // 对 /api/user 的请求会被代理到 http://localhost:3000/user
    target: "http://localhost:3000", // 将 URL 中带有 /api 的请求代理到本地的 3000 端口的服务上
    pathRewrite: {"^/api" : ""} // 把 URL 中 path 部分的 `api` 移除掉
  }
}
```
有时候不想代理所有请求, 那就通过一个函数的返回值来绕过代理

好的按照上面的配置一步步后, 我们就可以在 package.json 的 scripts 对象中添加 "dev": "webpack-dev-server --inline --progress --config ./bin/webpack.base.conf.js", 注意请保证 webpack 为 3.6 以上的版本.

启动服务后, webpack-dev-server 现在会去读取项目根路径下的 index.html 文件; 而且还要知道一点, webpack 打包的话是会生成真实的文件的, 但是 **webpack-dev-server 的输出只存在于内存中而不生成真实的文件**.

- target: 代理后的目标
- pathRewrite: 重写需被代理的路径
- contentBase: 用于配置提供额外静态文件内容的目录, 之前提到的 publicPath 是配置构建好的结果以什么样的路径去访问, 而 contentBase 是配置额外的静态文件内容的访问路径, 即那些不经过 webpack 构建, 但是需要在 webpack-dev-server 中提供访问的静态资源(如部分图片等). 推荐使用绝对路径:
```js
// 使用当前目录下的 public
contentBase: path.join(__dirname, "public")

// 也可以使用数组提供多个路径
contentBase: [path.join(__dirname, "public"), path.join(__dirname, "assets")]
```
- before/after:  配置用于在 webpack-dev-server 定义额外的中间件, 如
```js
before(app){
  app.get('/some/path', function(req, res) { // 当访问 /some/path 路径时, 返回自定义的 json 数据
    res.json({ custom: 'response' })
  })
}
```
  - before 在 webpack-dev-server 静态资源中间件处理之前, 可以用于拦截部分请求返回特定内容, 或者实现简单的数据 mock.
  - after 在 webpack-dev-server 静态资源中间件处理之后, 比较少用到, 可以用于打印日志或者做一些额外处理.

### webpack-dev-middleware
如果熟悉使用 Node.js 进行 web 服务开发, 使用过 Express 或者 Koa, 那么 webpack-dev-middleware 会很适合. 先安装吧:
```shell
npm install webpack-dev-middleware --save-dev
```

webpack-dev-middleware 是在 Express 中提供 webpack-dev-server 静态服务能力的一个中间件, 很轻松就可以集成到 Express 代码中, 因为这就是一个中间件:
```js
const webpack = require('webpack')
const middleware = require('webpack-dev-middleware')
const webpackOptions = require('./webpack.config.js') // webpack 配置文件的路径

// 本地的开发环境默认就是使用 development mode
webpackOptions.mode = 'development'

const compiler = webpack(webpackOptions)
const express = require('express')
const app = express()

app.use(middleware(compiler, {
  // webpack-dev-middleware 的配置选项
}))

// 其他 Web 服务中间件
// app.use(...)

app.listen(3000, () => console.log('Example app listening on port 3000!'))...
```

#### 实现简单的 mock 服务
前端开发中 mock 后端 API 的数据是很有用的, 通过 webpack-dev-server 或 Express + webpack-dev-middleware 都可以实现简单的 mock 服务

mock 服务的需求是当浏览器请求某一个特定的路径时(如 /some/path), 可以访问我们想要的数据内容.

先看看基于 Express 实现简单的 mock 功能:
```js
mock.js
module.export = function mock (app) {
  app.get('/some/path', (req, res) => {
    res.json({ data: '' })
  })

  // ... 其他的请求 mock
  // 如果 mock 代码过多, 可以将其拆分成多个代码文件, 然后 require 进来
}

// 应用到配置中的 before 字段
const mock = require('./mock')

// ...
before(app) {
  mock(app) // 调用 mock 函数
}
```

