# Fire - a simple sammy application

fire, flash & vanish ;)

## Description

Fire is a Sammy application that provides a little notifications system (think of growl in OSX) for web-applications

## Usage

1) Run the Fire.Server

		Sammy("#yourserver", function(app){
			app.use(Fire.Server);
		});

		[...]

		Sammy("#foo").run();

2) Push notification(s) to the Fire.Server

2.1) From within Sammy using Fire.Client

	  Sammy("#yourclient", function(app){
		  app.use(Fire.Client);
	    app.bind('run', function(){
	      this.fire.connect("#yourserver");
	    });
	    app.get('#!/something', function(c){

		    // simple message
	      c.fire.flash({type: "info", msg: "something happend"});

	      // for async callbacks
	      var fire = c.fire.flash({type: "loading", "something is loading"}); // fireId is generated
	      $.getJSON('/foo', function(resp){
		       c.fire.vanish(fire); // fireId is used to find and hide the notification
	      });

	    });
	  });

2.2) Outside Sammy via jQuery

	  // simple message
	  jQuery("#yourserver").trigger("fire-flash", {type: "info", msg: "something happend"});

	  // for async callbacks
	  var fire = {type: "loading", "something is loading", id: Fire.generateId()};
	  jQuery("#yourserver").trigger("fire-flash", fire);
	  $.getJSON('/foo', function(resp){
		  jQuery("#yourserver").trigger("fire-vanish", fire);
		});
			
## License

Fire is covered by the MIT License. See LICENSE for more information.