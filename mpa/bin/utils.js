const glob = require('glob')
const path = require('path')
const fs = require('fs')
const colors = require('colors')
const config = require('./config')

exports.getEntries = function (extensions, options) {
  const res = {}
  options = options || {}
  const verbose = options.verbose || true
  extensions = extensions || ['.js']

  extensions.forEach(validExt => {
    const srcDir = config.path.assetsPath
    const files = glob.sync(srcDir + '/**/*' + validExt, options).filter(filepath => {
      const extension = path.extname(filepath)
      const basename = path.basename(filepath, validExt)

      // 后缀不相等
      if (extension !== validExt) return false
      // 文件名以 '_' 开头
      if (!options.noskip && basename[0] === '_') return false
      // 文件名包含 数字、 字母、 _ 以外的部分
      if (!basename.match(/[A-Za-z0-9]+$/)) return false
      // 文件内容以 /*not entry*/ 开始

      // 打开文件并读取， 将内容读到 buf 中的 0-13
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
      // 方便根据 entry 生成 chunk 时， 路径保持一致
      let key = path.relative(options.baseDir || srcDir, filepath)
      key = key.replace(validExt, '')

      // 当 options 有 includes 和 excludes 选项时
      // 有 includes 选项， 那么必须声明在内
      // 有 excludes 选项， 如果在内就忽略
      if(includes) {
        if (includes.indexOf(key) < 0) return
      } else if (excludes) {
        if (excludes.indexOf(key) >= 0) return
      }

      res[key] = filepath
    })
  })
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
}
