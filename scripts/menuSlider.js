/* MENUSLIDER JavaScript FILE
 * 
 * require thirdparty/tangram-1.5.2.2.js
 * require thirdparty/tangram-custom-full-yui.js
 *
 * author   : huwence
 * data     : 2012-7-5 18:33:21
 * editor   : vim
 * mail     : huwence@gmail.com
 *
 * */


(function (){

    /**
     * 动态效果插值函数
     * @params {DOUBLE} percent 插值系数
     *
     * */
    var effectFn = {
        liner: function (percent){
            return percent;
        },

        double: function (percent){
            return 1 - Math.pow(1 - percent, 2);    
        }
    }

    /**
     * 实现元素高度或者宽带变化效果
     * @name baidu.fx.wh
     * @function
     * @params {HTMLElement}       elemnt    目标元素
     * @param  {JSON}              options   效果变化配置参数
     * return  {baidu.fx.Timeline}
     *
     * */
    baidu.fx.wh = function (element, options){
        if (!(element = baidu.dom.g(element))) return null;

        options = options || {};
        if (!options.height && !options.width) return null;

        var fx = baidu.fx.create(element, baidu.object.extend({

           //实现Timeline类中的接口(initialize)
           initialize: function () {

              this.originValue = {
                  height: parseInt(baidu.dom.getStyle(element, "height")),
                  width : parseInt(baidu.dom.getStyle(element, "width"))  
              }
           },

           //实现Timeline类中的接口(transition)
           transition: function (percent){
              var type = options.effectType ? options.effectType : "double";
              return effectFn[type](percent);           
           },

           //实现Timeline类中的接口(render)
           render: function (value){
              var self = this;
              baidu.array.each(["width", "height"], function (item){
                  
                  if (options[item]){
                      element.style[item] = ((1 - value) * self.originValue[item]  + value * options[item]) +  "px";
                  }   

              })
           }
        
        }, options), "baidu.fx.wh");
        
        return fx.launch();
    }

   /**
    * 菜单滑动效果
    * @name baidu.fx.MenuSlider
    * @function
    * @params {Object}  options 函数参数值，包括添加效果的DOM元素，滑动效果的参数
    * @version 0.0.1 
    *
    * */
    
    baidu.ui.MenuSlider = baidu.ui.createUI(function (options){
         var self = this;

         if (!options.renderTo) return null;
         self.element   = options.renderTo;
         self.items     = options.items || [];
         //item滑入时最大宽度
         self.max       = options.max || 310;
         //item滑入时其它item的最小宽度
         self.min       = options.min || 45;
         //menu初始化时各个item的宽度
         self.origin    = options.origin || 98;
         //每个item的id集合
         self._itemsId  = [];
         //每个item的Timeline实例对象, key:id|value:instance
         self._timers   = {};

    }).extend({
         uiType : "menuSlider",
         /*template*/
         tplLi  : "<li><a id='#{id}' class='#{class}' href='#{url}' target='_blank'></a></li>", 
         tplDOM : "<div id='#{id}' class='#{class}'>#{body}</div>",
         
        /*
         * 得到menu的HTML
         * @return {HTMLString} string
         *
         * */
         _getString: function (){
             var self    = this,
                 items   = self.items,
                 content = [];

             baidu.array.each(items, function (item, index){
                 content.push(self._getItemString(item, index));
             });

             return baidu.string.format(self.tplDOM, {
                 id      : self.getId('menu'),
                 'class' : self.getClass('menu'),            
                 body    : content.join('') 
             });
         
         },

         /*
          * 得到item的HTML
          * @return {HTMLString} string
          * */
         _getItemString: function (item, index){
             var self   = this,
                 itemId = self.getId(item.id);

             self._itemsId.push(itemId);
             return baidu.string.format(self.tplLi, {
                 id      : itemId,
                 url     : item.url,
                 'class' : self.getClass('item') + " " + item.className
             })        
         },

         /**
          * 依次添加item的事件
          * @params {String} id
          *
          * */
         _addEvent: function (id){
             var self = this;

             baidu.array.each(["click", "mouseenter"], function (type){
                 baidu.event.on(id, type, (function (listenerType){
                     return function (){
                         self["_" + listenerType](id);
                     } 
                 })(type));
             }); 
                   
         },

         /**
          * 添加菜单事件
          * @param {HTMLDOM} mainMenu  菜单DIV
          *
          * */

         _addMainEvent: function (mainMenu){
             var self = this;

             baidu.event.on(mainMenu, "mouseleave", function (){
                baidu.array.each(self._itemsId, function (itemId){
                    self._timers[itemId] = baidu.fx.wh(baidu.dom.g(itemId), {width: self.origin, duration: 1000, onbeforestart: function (){
                        self._stop(itemId);
                    }, onafterfinish: function (){}});
                });       
             });              
         },

         /**
          * 根据id终止滑动效果
          * @params {String} id 需要终止滑动效果元素的id
          *
          * */
         _stop: function (id){
             var self = this;

             for (var i in self._timers){
                if ({}.hasOwnProperty.call(self._timers, i) && i === id){
                    //调用Timeline实例方法取消
                    self._timers[i].cancel();
                }
             }
                
         },

         /**
          * 点击事件
          * @params {String} id DOM元素ID
          *
          * */
         _click: function (id){
             var self = this,
                 item = baidu.dom.g(id);
             
             alert("Hi, this is my log: " + item.href);
         },

         /**
          * 鼠标进入
          * @params {String} id DOM元素ID
          *
          * */
         _mouseenter: function (id){
              var self    = this,
                  item    = baidu.dom.g(id);

                  self._stop(id);
                  self._timers[id] = baidu.fx.wh(item, {width: self.max, duration: self.duration || 500, onafterfinish: function (){}})
                  baidu.array.each(self._itemsId, function (itemId){
                      if (itemId != id){
                          self._timers[itemId] = baidu.fx.wh(baidu.dom.g(itemId), {width: self.min, duration: self.duration || 500, onafterfinish: function (){}})
                      }
                  });
              
         },

         /**
          * 鼠标进入
          * @params {String} id DOM元素ID
          *
          * */
         _mouseout: function (id){
              var self = this,
                  item    = baidu.dom.g(id);

              //self._timers[id].cancel();
              //self._timers[id] = baidu.fx.wh(item, {width: self.min, onafterfinish: function (){}});
         },

         /**
          * 提交渲染
          * */
         render: function (){
             var self = this;

             //插入渲染
             baidu.dom.insertHTML(self.renderMain(self.element), "beforeEnd", self._getString());  

             //绑定事件
             baidu.array.each(self._itemsId, function (id, index){
                 self._addEvent(id);
             })

             self._addMainEvent(baidu.dom.first(self.element));

         }

    });


})();
