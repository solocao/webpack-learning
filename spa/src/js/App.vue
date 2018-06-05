<template lang="jade">
  .app hello {{ world }}
    p 121212
    img(src="~@/img/bg.png")
    img(src="~@/img/lock-icon-bg.png")
</template>

<script>
import Vue from 'vue'
import utils from 'utils/_utils.js'
export default {
  name: 'app',
  data () {
    return {
      world: 'world'
    }
  },
  mounted () {
    console.log('test')
    console.log('123')
  }
}
</script>

<style scoped lang="stylus">
.app {
  color: red
}

.app
  font-size: 30px
</style>

