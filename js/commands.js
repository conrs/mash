/* 
	Basic command system. 

	name: ""
	about: about string for help
	execute: function


	TODO: eventually modify output properly for those long-running async 
	commands.

 */

var COMMANDS = 
{
	raw: 
	[ 
		{
			name: "help",
			about: "this help menu",
			execute: function()
			{
				var padding_width = os.CONSOLE_WIDTH / 2;

				io.output.write("mash, version 1.5");

				for(var command in COMMANDS.find)
				{
					var line = command; 
					console.log(command);
					var about_string = COMMANDS.find[command].about;

					while(about_string.length > 0)
					{
						while(line.length < padding_width)
							line += " ";

						line += about_string.substring(0, os.CONSOLE_WIDTH - padding_width);
						about_string = about_string.substring(os.CONSOLE_WIDTH - padding_width);

						io.output.write(line);

						line = "";
					}
				}
			}
		},
		{
			name: "echo",
			about: "echos user-specified text",
			execute: function(arguments)
			{
				io.output.write(sanitize(arguments));
			}
		},
		{
			name: "login",
			about: "log in as a user",
			execute: function(arguments)
			{
				var spaceIndex = arguments.indexOf(" ");

				if(spaceIndex == -1)
					spaceIndex = arguments.length;

				var name = arguments.substring(0, spaceIndex);

				name = sanitize(name);
				
				if(name.toLowerCase() == "matt")
				{
					io.output.write("No.");
				} else if (name == "")
				{
					io.output.write("Please specify a username.");
				}
				else
				{
					io.output.write("Welcome, " + name);
					os.currentUser = name;
					$.cookie("user", os.currentUser);
				}
			}
		},
		{
			name: "clear",
			about: "clears the console output", 
			execute: function()
			{
				io.output.clear();
			}
		},
		{
			name: "email",
			about: "send an email to Matt, your favourite person ever.",
			execute: function()
			{				
				var link = $("<a></a>");
				link.attr("href", "ma"+"ilto:m"+"@t"+"t.con.rs");
				link.html("m"+"@t"+"t.con.rs");
				io.output.writeElement(link);
			}
		},
		{
			name: "fork",
			about: "fork this project on github",
			execute: function()
			{
				window.open("https://github.com/omgz0r/mash");
			}
		},
		{
			name: "wall",
			about: "send a message to all users",
			execute: function(args)
			{
				var data = {
					"user": os.currentUser,
					"message": args
				};
				$.ajax(
				{
					url: "backend/wall.php",
					data: data
				});
			}
		},
		{
			name: "say",
			about: "reads the arguments using the power of the internet",
			execute: function(args)
			{
				var data = {
					text: args
				};

				$.ajax(
					{
						url: "backend/sayer.php",
						data: data,
						dataType: "json",
						success: function(data)
						{
							var items = [];
							$.each(data, function(i, elem)
							{
								x = new Audio(elem.href);
								items.push(x);
								playItems(items, 0);
							});
						}
					});
			}
		}
	],

	find: {}
};

for(var i in COMMANDS.raw)
{
	COMMANDS.find[COMMANDS.raw[i].name] = COMMANDS.raw[i];
}

function playItems(items, startIndex)
{
	if(startIndex < items.length )
	{
		item = items[startIndex];
		item.addEventListener('ended', function() { playItems(items, startIndex + 1)});
	
		item.play();
	}
}


