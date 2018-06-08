const express = require('express')
const app = express()
const path = require('path')

app.use('/static', express.static(path.resolve(__dirname, './build/prod')))

app.use(require('./controller'))

app.listen(10010, _ => {
  console.log('server started!')
})
