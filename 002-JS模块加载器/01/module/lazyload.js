loader.define('lazyload', function(){
  console.log('define lazyload', Date.now())
  return function () {
    console.log('I am lazyload')
  }
})