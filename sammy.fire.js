// name: sammy.fire
// version: 0.2.0

(function($) {
	
	Fire = {};
	Fire.VERSION = "0.2.0";
	
	Fire.generateId = function(){ return Math.random().toString().replace('.','').replace(/^0+/, ''); }; // no ".", no leading "0"
  Fire.Client = function(app){
	  app.use(Sammy.Storage);
	  app.helpers({
	    fire: {
			  fireServer: null,
			  connect: function(selector) {
				  this.fireServer = selector;
				  if ($(this.fireServer).length) {
			      app.log('OK: FireClient at Sammy('+app.element_selector+') running and found FireServer at Sammy('+this.fireServer+')');
			      app.log('TRY: Testing Connection to FireServer Sammy('+this.fireServer+')');
			      $(this.fireServer).trigger('ping.fire', app.element_selector);
			    } else {
			      app.error('FireClient at Sammy('+app.element_selector+') running but found no FireServer at Sammy('+this.fireServer+')');
			    }
			  }
				,flash: function(opts) {
				  if (!opts.id) { opts.id = Fire.generateId(); }
		      if ($(this.fireServer).length) {
		        Sammy(this.fireServer).trigger('fire-flash', opts);
		      } else {
		        app.error('FireServer not found');
		      }
		      return opts;
			  }
			  ,vanish: function(opts) {
				  if (!opts.id) { opts.id = Fire.generateId(); }
			    if ($(this.fireServer).length) {
		        Sammy(this.fireServer).trigger('fire-vanish', opts);
		      } else {
		        app.error('FireServer not found');
		      }
		      return opts;
		    }
		  }      
	  });
	};
	Fire.Server = function(app){
		var staticHtml = function(){
			var bar = "<div class='fire-bar'><span class='count'>0</span> Notifications<span class='latest'></span></div>\n";
			var dialog = "<div class='fire-dialog-wrapper'>\n<div class='fire-dialog'>\n<h3>Notifications</h3>\n<div class='content'> </div>\n<h3>Timed-out Notifications (max. 5)</h3>\n<div class='contentArchive'> </div>\n</div>\n</div>\n";
			var ghost = "<div class='fire-ghost'> </div>\n";
	    return bar + dialog + ghost;		
		}
	  var $dialog = function(){ return $(app.$element().find('.fire-dialog-wrapper')); }
	  var defaults = {
	    fireArchiveSize: 5
	    ,defaultFire: { type: "info", timeout: 9000, timeoutId: null, ghost: false }
	    ,types: {
	      success: {classname: 'fire-success', text: "Success"}
	      ,error: {classname: 'fire-error', text: "Error"}
	      ,info: {classname: 'fire-info', text: "Info"}
	      ,loading: {classname: 'fire-loading', text: "Loading"}
	    }
	    ,ghostTimeout: 2000
	  };
	  var getType = function(typeName) {
		  return (defaults.types[typeName]) ? defaults.types[typeName] : defaults.types[defaults.defaultFire.type];
	  }
	  app.bind('run', function() {
		  app.swap(staticHtml());
	    app.log('OK: FireServer at Sammy('+app.$element().selector+') running');
	    var $fireBar = app.$element().find('.fire-bar');
	    var positioner = {my: 'left top', at: 'left bottom', of: $fireBar, offset: '5px 0'};
	    var clicker = function(){ app.$element().find('.fire-bar').click(); };
	    app.$element().find('.fire-bar').click(function(){
	      $dialog().find('.fire-dialog').toggle();
	    });
	    $dialog().find('.fire-dialog').click(clicker).position(positioner).width($fireBar.width()-10);
	    return true;
	  });
	  app.bind('ping.fire', function(e,fireClientSelector){
	    app.log('OK: FireServer Sammy('+app.element_selector+') successfully called from FireClient Sammy('+fireClientSelector+')');
	  });
	  var Fire = function(opts) {
	    this.data = $.extend({}, defaults.defaultFire, opts);
	    if (!this.data.id) { 
	      this.data.id = Fire.generateId();
	    }
	    this.timeout = function(callback){
	      if (this.data.timeout && this.data.type != 'loading') {
	        this.data.timeoutId = window.setTimeout(function(self){
	          return function(){ callback.apply(self) };
	        }(this), this.data.timeout);
	      }
	    };
	    this.getShortMsg = function() {
	      var shortText = this.data.msg.substr(0,50);
	      if (shortText != this.data.msg) { shortText += '...'; }
	      return shortText;
	    };
	    this.buildShortHtml = function(){
	      var html = "<span class='fire-"+this.data.id+" "+getType(this.data.type).classname+"'>";
	      html += getType(this.data.type).text+": "+this.getShortMsg()+"</span>";
	      return html;
	    };
	    this.buildLongHtml = function(){
		   with (this.data) {
				 return html = "<div class='fire "+getType(type).classname+" fire-"+id+"'>"+getType(type).text+": <span class='msg'>"+msg+"</span></div>";
		   }
	    }
	  };
	  var fires = new (function(){
	    this._fires = {};
	    this.flash = function(opts) {
	      var myFire = new Fire(opts);
	      this._fires[myFire.data.id] = myFire;
	      myFire.timeout(function(){
	        fires.vanish(this.data);
	      });
	      app.trigger('fires-flashed', {flashed: myFire});
	      app.trigger('fires-updated');
	    };
	    this.vanish = function(opts) {
	      var myFire = this._fires[opts.id];
	      delete(this._fires[opts.id]);
	      app.trigger('fires-vanished', {vanished: myFire});
	      app.trigger('fires-updated');
	    };
	    this.count = function() {
	      var count = 0;
	      for (var id in this._fires) {
	        count++;
	      }
	      return count;
	    };
	  })();
	  app.bind('fire-flash', function(e,data){
	    fires.flash(data);
	  });
	  app.bind('fire-vanish', function(e,data){
	    fires.vanish(data);
	  });
	  app.helpers({
	    fire: {
		    fires: fires
		  }
	  });
	  app.bind('fires-flashed', function(e,data){
	    var c = this;
	    try {
	      var fireObj = data.flashed;
	      var $archive = $dialog().find('.fire-dialog').find('.contentArchive');
	      app.$element().find('.latest').html(fireObj.buildShortHtml());
	      var $content = $dialog().find('.fire-dialog').find('.content');
	      $content.prepend(fireObj.buildLongHtml());
	      if (fireObj.data.ghost) {
	        app.$element().find('.fire-ghost').stop(true,true).html(fireObj.data.msg).show().position(app.fireGhostPos()).fadeOut(defaults.ghostTimeout);
	      }
	    } catch (e) {
	      c.log(e);
	    }
	  });
	  app.bind('fires-vanished', function(e,data){
	    var c = this;
	    try {
	      var fireObj = data.vanished.data;
	      var $archive = $dialog().find('.fire-dialog').find('.contentArchive');
	      app.$element().find('.latest').find('.fire-'+fireObj.id).remove();
	      if (fireObj.type != 'loading') {
	        $dialog().find('.fire-dialog').find('.fire-'+fireObj.id).prependTo($archive);
	      } else {
	        $dialog().find('.fire-dialog').find('.fire-'+fireObj.id).remove();
	      }
	    } catch (e) {
	      c.log(e);
	    }
	  });
	  app.bind('fires-updated', function(e,data) {
	    var c = this;
	    try {
	      var activeItemCount = fires.count();
	      app.$element().find('.count').text(activeItemCount); 
	      var $archive = $dialog().find('.fire-dialog').find('.contentArchive');

	      // archive older notifications
	      $archive.find('.'+getType('loading').classname).remove();
	      $archive.children(':gt('+( defaults.fireArchiveSize - 1 )+')').remove();
      
	      // after dom manipulation
	      var $active = $dialog().find('.fire-dialog').find('.content');  
	      if (activeItemCount > 0) {
	        app.$element().find('.fire-bar').addClass('ui-state-active');
	        $active.prev().show();
	      } else {
	        app.$element().find('.fire-bar').removeClass('ui-state-active');
	        $active.prev().hide();
	      }
	      if ($archive.children().length > 0) {
	        $archive.prev().show();
	      }
	    } catch (e) {
	      c.log(e);
	    }
	  });
	};
})(jQuery);