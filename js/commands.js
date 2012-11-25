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
				var padding_width = console_width / 2;

				io.output.write("mash, version 1.0");

				for(var command in COMMANDS.find)
				{
					var line = command; 
					console.log(command);
					var about_string = COMMANDS.find[command].about;

					while(about_string.length > 0)
					{
						while(line.length < padding_width)
							line += " ";

						line += about_string.substring(0, console_width - padding_width);
						about_string = about_string.substring(console_width - padding_width);

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
					userName = name;
					preCommandString = "con.rs:~ " + userName + "$ ";
					$.cookie("user", userName);
					input.trigger('keyup');
				}
			}
		},
		{
			name: "clear",
			about: "clears the console output", 
			execute: function()
			{
				output.html("");
			}
		},
		{
			name: "email",
			about: "send an email to Matt, your favourite person ever.",
			execute: function()
			{				
				window.open("ma"+"ilto:m"+"@t"+"t.con.rs");
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
					"user": userName,
					"message": args
				};
				$.ajax(
				{
					url: "backend/wall.php",
					data: data
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
