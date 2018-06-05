const config = require('./config.js')
// 注意, 一定要在 webpackConfig 之前
process.env.NODE_ENV = config.prod.env

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

  console.log(chalk.yellow('\nremove path' + config.prod.assetsRoot))

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
