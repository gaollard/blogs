loader.define('lazyload', function(){
  // 这里一定要同步返回一个值
  console.log('define lazyload', Date.now())
  return function () {
    console.log('I am lazyload')
  }
})