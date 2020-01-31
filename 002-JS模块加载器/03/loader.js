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
   * define('sleep', ['common'], function(common){ return function(){}}) sleep模块依赖 common模块
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
   * @examples:
   * require('common', function(common){}) 加载一个模块
   * require(['common', 'toolbar], function(common, toolbar){}) 加载多个模块
   */
  require: function(name, requireCb) {    
    if (Array.isArray(name)) {
      // 加载多个
      this._requires(name, () => {
        const injector = name.map(v => this.modules[v])
        requireCb(...injector)
      })
      return
    }
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
  _requires: function(names, fn) {
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
   * @description 处理某个模块加载完成
   * @param {string} name 
   */
  _onLoadScriptSuccess: function(name) {
    if (!this.deps[name]) {
      this.modules[name] = this.moduleDefined[name]();
      this.installed[name].forEach(fn => {
        fn(this.modules[name]);
      })
    } else {
      this._requires(this.deps[name], () => {
        const injector = this.deps[name].map(v => this.modules[v])
        this.modules[name] = this.moduleDefined[name](...injector);
        this.installed[name].forEach(fn => {
          fn(this.modules[name]);
        })
      });
    }
  },

  /**
   * @description 加载JS文件
   * @param {string} name 模块名
   */
  loadScript: function (name) {
    let script = document.createElement('script')
    script.src = this.config.baseDir + '/' + name + '.js'
    script.onload = () => {
      this._onLoadScriptSuccess(name)
    }
    document.body.append(script)
  }
}