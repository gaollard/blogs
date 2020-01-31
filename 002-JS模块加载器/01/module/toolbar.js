loader.define('toolbar', ['common', 'lazyload'], function(){
	console.log('define toolbar', Date.now())
  return function () {
    console.log('I am toolbar')
  }
})