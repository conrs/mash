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
	socket: null,
	output: 
	{
		write: function(str)
		{
			while(str.length > 0)
			{
				var line = str.substring(0, console_width);

				$("#"+output_id).append(line);
				$("#"+output_id).append("\n");

				str = str.substring(console_width);
			}
		},
		clear: function()
		{
			$("#"+output_id).html("");
		}
	},
	input: 
	{
		prepare: function()
		{
			input = $("#" + input_id);
			
			preCommandString = "con.rs:~ " + userName + "$ ";
			
			input.focus();	
			io.input.prompt(preCommandString);

			input.bind('keyup', function(e)
			{
				var keyCode = e.keyCode;
				var val = $.trim($(this).val());
				fillPrompt(preCommandString + sanitize(val));

				if(keyCode == 32)
				{
					// Manually increase width so cursor appears properly.
					$("#" + input_id).append("&nbsp;");
				} else if (keyCode == 13)
				{
					io.input.lineEntered();
				}

				e.stopPropagation();
			});
		},
		// "Temporary" laziness
		listeners: [
			{
				lineEntered: function()
				{
					var val = $("#" + input_id).val().trim();
					interpret(val);
					$("#" + input_id).val("");
					$("#"+overflow_id).remove();
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