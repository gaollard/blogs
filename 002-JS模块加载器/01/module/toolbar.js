loader.define('toolbar', ['common'], function(){
	console.log('define toolbar', Date.now())
  return function () {
  	console.log(loader.modules.common)
    console.log('I am toolbar')
  }
})