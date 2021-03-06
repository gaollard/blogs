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
   * @param {*} requireCb 加载完成回调函数
   */
  require: function(name, requireCb) {
    if (this.modules[name]) {
      // 已经加载成功, 直接从缓存读取
      requireCb(this.modules[name])
    } else {
      if (this.status[name]) {
        // 加载过了, 但是还未加载成功
        this.installed[name].push(requireCb)
      } else {
        // 还未加载过
        this.installed[name] = []
        this.installed[name].push(requireCb)
        this.loadScript(name)
        this.status[name] = true
      }
    }
  },

  /**
   * @description 加载多个模块
   * @param {string} names 模块名数组
   * @param {*} fn 回调函数
   */
  requires: function(names, fn) {
    let excuted = false
    names.forEach(name => {
      this.require(name, () => {
        if (!excuted) {
          // 保证回调只执行一次
          if (names.filter(v => this.modules[v] !== undefined).length === names.length) {
            excuted = true
            fn && fn()
          }
        }
      })
    })
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
      if (!_this.deps[name]) {
        _this.modules[name] = _this.moduleDefined[name]();
        _this.installed[name].forEach(fn => {
          fn(_this.modules[name]);
        })
      } else {
        _this.requires(_this.deps[name], () => {
          // 依赖项全部加载完成
          _this.modules[name] = _this.moduleDefined[name]();
          _this.installed[name].forEach(fn => {
            fn(_this.modules[name]);
          })
        });
      }
    }
    document.body.append(script)
  }
}