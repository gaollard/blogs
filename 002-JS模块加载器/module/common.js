loader.define('common', function(){
	console.log('define common', Date.now())
  return function () {
    console.log('I am common')
  }
})