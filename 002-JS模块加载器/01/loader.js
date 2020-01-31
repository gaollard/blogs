/**
 * loader 模块加载器
 */
var loader = {
  config: { // 配置
    baseDir: window.location.origin + '/module'
  },
  modules: {}, // 缓存
  installed: {}, // 加载成功
  status: {}, // 加载状态
  deps: {}, // 模块的依赖
  moduleDefined: {}, // 缓存模块的定义

  /**
   * @description 注册模块, 每个模块最多只会注册1次
   * @example:
   * define('sleep', function(){ return 5 }) 定义模块名为sleep，导出值为5
   * define('sleep', function(){ return { name: 5 } }) 定义模块名为sleep，导出一个对象
   * define('sleep', function(){ return function(){ console.log(5)}}) 定义模块名为sleep，导出一个函数
   */
  define: function() {
    let name, fn, deps, args = arguments
    if (args.length === 2) {
      name = args[0]
      fn = args[1]
    } else if (args.length === 3) {
      name = args[0]
      deps = (typeof args[1] === 'string') ? [args[1]] : args[1]
      fn = args[2]
    } else {
      throw "invalid params for define function"
    }

    // 收集依赖
    if (deps) this.deps[name] = deps;

    // 缓存模块导出函数
    this.moduleDefined[name] = fn
  },

  /**
   * @description 加载模块
   * @param {string} name 模块名
   * @param {*} fn 回调函数
   */
  require: function(name, fn) {
    if (this.modules[name]) {
      // 已经加载成功, 直接从缓存读取
      callback(this.modules[name])
    } else {
      if (this.status[name]) {
        // 加载过了, 但是还未加载成功
        this.installed[name].push(fn)
      } else {
        // 还未加载过
        this.installed[name] = []
        this.installed[name].push(fn)
        this.loadScript(name)
        this.status[name] = true
      }
    }
  },

  /**
   * @description 加载JS文件
   * @param {string} name 模块名
   */
  loadScript: function (name) {
    let _this = this
    let script = document.createElement('script')
    script.src = this.config.baseDir + '/' + name + '.js'

    script.onload = function () {
      // 需要注意, 当模块的JS文件加载完成, 不能立即调用require(name, fn) 所注册的fn回调函数
      // 因为它可能依赖其它模块, 需要将依赖的模块也加载完成之后, 再触发
      // _this.installed[name] 为数组是因为并行加载时, 注册了多个回调
      _this.installed[name].forEach(fn => {
        if (!_this.deps[name]) {
          // 该模块没有依赖其他模块
          // 通过模块导出函数获取该模块的导出值
          _this.modules[name] = _this.moduleDefined[name]();
          // 执行回调
          fn(_this.modules[name])
        } else {
          _this.deps[name].forEach(dep => {
            // 加载依赖, 这里存在bug, 当dep已经被加载过时, 会导致cb重复执行多次
            _this.require(dep, () => {
              // 这里每一个依赖的回调都相同, 后续将加载多个依赖的逻辑抽离出去
              _this.modules[name] = _this.moduleDefined[name]();
              _this.installed[name].forEach(fn => fn(_this.modules[name]))
            })
          })
        }
      })
    }
    setTimeout(() => {
      // 模拟HTTP请求时间
      document.body.append(script)
    }, 100)
  }
}