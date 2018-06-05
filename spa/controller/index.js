const router = require('express').Router()
const path = require('path')

router.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build/prod/index.html'))
})

module.exports = router
