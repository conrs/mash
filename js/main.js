

var userName;
var preCommandString;



var cursorVisible = true;

var console_width = 80;

$(document).ready(function()
{
	var pusher = new Pusher('1cd61253e47ce70d1a4e'); 


	io.socket = pusher.subscribe('comm');
	//io.output.clear();

	var last_seen = $.cookie("last-seen");
	userName = $.cookie("user");

	if(userName == null)
		userName = "guest"

	preparePrompt();

	printWelcome(last_seen);

	fakePush();

	$.cookie("last-seen", new Date());

});

function fakePush()
{
	io.socket.bind('wall', function(data) {
		console.log(data);
		io.output.write("Broadcast message from " + data.user);
		io.output.write(" ");
		io.output.write(sanitize(data.message));
		io.output.write(" ");
	});
}

$(document).click(function(e)
{
	$("#text_catcher").focus();
});

$(document).bind('keyup', function(e)
{
	val = "";

	if(e.keyCode >= 65 && e.keyCode <= 90)
	{
		val = String.fromCharCode(e.keyCode);

		if(!e.shiftKey)
			val = val.toLowerCase();
	}

	$("#text_catcher").val(val)
	$("#text_catcher").focus();
	$("#text_catcher").trigger("keyup");
});

// Last login: Sat Nov 10 01:07:58 on ttys003
function printWelcome(last_seen)
{
	var last_seen_text;


	if(last_seen == null)
		last_seen_text = "Last login: never. Welcome!";
	else
		last_seen_text = "Last login: " + formatDateForTerminal(last_seen) + " from intertubes";
	
	io.output.write(last_seen_text);
}

function interpret(command_string)
{
	var spaceIndex;

	var command;
	var arguments;

	spaceIndex = command_string.indexOf(" ");
	if(spaceIndex == -1)
		spaceIndex = command_string.length;

	command = command_string.substring(0, spaceIndex);
	arguments = command_string.substring(spaceIndex + 1);


	io.output.write(preCommandString + sanitize(command_string));

	execute(command, arguments)
}

function execute(command, arguments)
{
	console.log("command: '" + command + "'");

	var cmd = COMMANDS.find[command];
	if(cmd)
	{
		cmd.execute(arguments);
	} else if(command != "")
	{
		io.output.write("-mash: " + sanitize(command) + ": command not found")
	}
}

function preparePrompt()
{
	io.input.prepare();

	setInterval(function()
	{
		if(cursorVisible)
			$("#cursor").hide();
		else
			$("#cursor").show();

		cursorVisible = !cursorVisible;
	}, 600);

}

function fillPrompt(command_string)
{
	// tricky when needing to be multiple lines.

	$("#"+overflow_id).remove();

	while(command_string.length > 0)
	{
		command_line = command_string.substring(0, console_width);
		command_string = command_string.substring(console_width);

		if(command_string.length == 0)
		{
			$("#user_prompt").html(command_line);
		} else
		{
			var overflow_div = $("#"+overflow_id);

			if(overflow_div.length == 0)
			{
				overflow_div = $("<div></div>");

				overflow_div.attr("id", overflow_id);

				$("#user_prompt").before(overflow_div);
			}

			overflow_div.append(command_line);
			overflow_div.append("<br/>");
		}
	}

}


function sanitize(str)
{
	return str.replace(/\&/g, "&amp;").replace(/</g,'&lt;').replace(/>/g, '&gt;');
}

function formatDateForTerminal(date)
{
	date = new Date(date);
	day = date.weekday().substring(0, 3);
	month = date.month().substring(0, 3);

	return "" + day + " " + month + " " + date.getDate() + " " + date.time24();
}