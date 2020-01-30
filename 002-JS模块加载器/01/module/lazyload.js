loader.define('lazyload', function(){
	// 这里一定要同步返回一个值
  return function () {
    console.log('I am lazyload')
  }
})