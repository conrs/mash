/* 
	Basic I/O "module" 
	
	Encapsulates writing and reading from the command line, allowing us 
	to not care about the DOM except here. Possibly over-engineered, but 
	also allows for processes to take control of I/O. 

*/



var output_id = "console_output";
var input_id = "text_catcher";
var overflow_id = "command_overflow";
var prompt_id = "user_prompt";


var io = 
{
	history: [],
	historyIndex: 0,
	init: function()
	{
		// Weird but convenient placement for the 'wall' listener.
		var pusher = new Pusher('1cd61253e47ce70d1a4e'); 


		pusher.connection.bind("error", function(err) {
				console.log("pusher error - disabling wall command");
				COMMANDS.find["wall"] = null;
		}); 

		io.socket = pusher.subscribe('comm');

		io.socket.bind('wall', function(data) {
			io.output.write("Broadcast message from " + data.user);
			io.output.write(" ");
			io.output.write(sanitize(data.message));
			io.output.write(" ");
		});	

	},
	addHistory: function(command)
	{
		io.history.push(command);
		io.historyIndex = io.history.length;
	},
	historyUp: function()
	{
		ret = false;

		if(io.historyIndex > 0)
		{
			io.historyIndex--;
			ret = io.history[io.historyIndex];
		}

		return ret;
	},
	historyDown: function()
	{
		ret = "";

		if(io.historyIndex != io.history.length)
			io.historyIndex++;

		if(io.historyIndex < io.history.length)
			ret = io.history[io.historyIndex];

		return ret;
	},
	socket: null,
	output: 
	{
		writeElement: function(element)
		{
			$("#"+output_id).append(element);
			$("#"+output_id).append("<br/>");
			$(window).scrollTop($(document).height());
		},
		write: function(str)
		{
			while(str.length > 0)
			{
				var splitIndex = -1;
				splitIndex = str.indexOf("\n");

				if(splitIndex <= 0 || splitIndex > os.CONSOLE_WIDTH)
					splitIndex = os.CONSOLE_WIDTH;

				var line = str.substring(0, splitIndex);

				$("#"+output_id).append(line);
				$("#"+output_id).append("\n");
					

				str = str.substring(splitIndex);
			}

			$(window).scrollTop($(document).height());
		},
		writeError: function(command, error)
		{
			command = sanitize(command);
			io.output.write("-mash: " + command + ": " + error);
		},
		clear: function()
		{
			$("#"+output_id).html("");
		},
	},
	input: 
	{
		prepare: function()
		{
			input = $("#" + input_id);
			
			preCommandString = "con.rs:" + fs.pwd() + " " + os.currentUser + "$ ";
			
			input.focus();	
			io.input.prompt(preCommandString);

			input.bind('keydown', function(e)
			{
				if(e.keyCode == 9)
				{
					e.preventDefault();
				}
			});

			input.bind('keyup', function(e)
			{
				var keyCode = e.keyCode;
				var val = $(this).val().replace(/^\s/, "");
				fillPrompt(preCommandString + sanitize(val));

				cmd = val.split(" ")[0];
				path = val.split(" ")[1];

				switch(keyCode)
				{
					// ENTER 
					case 13:
						io.input.lineEntered();
						break;

					// UP ARROW
					case 38:
						cmd = io.historyUp();
						if(cmd)
						{
							$(this).val(cmd)
							fillPrompt(preCommandString + cmd);
						}
						else
							fillPrompt(preCommandString + val);
						break;

					// DOWN ARROW
					case 40:
						cmd = io.historyDown();
						
						$(this).val(cmd);
						fillPrompt(preCommandString + cmd);

						break;
					// TAB
					case 9:
						if(path)
						{
							str = fs.tryComplete(path);
							if(str)
							{
								newCommand = cmd + " " +  str;
								fillPrompt(preCommandString + newCommand);
								$(this).val(newCommand);
							}
						}
						
						break;

					// TODO: Left/Right Arrow Keys. Shit.
				}
				e.stopPropagation();
				e.preventDefault();
			});
		},
		// "Temporary" laziness
		listeners: [
			{
				lineEntered: function()
				{
					var val = $("#" + input_id).val().trim();
					interpret(val);
					preCommandString = "con.rs:" + fs.pwd() + " " + os.currentUser + "$ ";
					$("#" + input_id).val("");
					$("#"+overflow_id).remove();
					io.addHistory(val);
					io.input.prompt(preCommandString);
				}
			}
			
		],
		lineEntered: function()
		{
			// Read the line, forward to head of stack.
			var line = io.input.read();

			if(io.input.listeners.length != 0)
			{
				var head = io.input.listeners[io.input.listeners.length - 1];
				head.lineEntered(line);
			} else
			{
				console.log("Error: No listeners for I/O!");
			}
		},
		read: function()
		{

		},
		prompt: function(str)
		{
			$("#user_prompt").html(str);
		}
	}
}