var os = 
{
	CONSOLE_WIDTH: 80,
	currentUser: null,
	init: function()
	{
		var last_seen = $.cookie("last-seen");
		var userName = $.cookie("user");

		if(userName == null)
			userName = "guest"

		os.currentUser = userName;

		io.init();

		preparePrompt();

		printWelcome(last_seen);

		// Weird place for this half of wall functionality. Commands may need a constructor. 
		io.socket.bind('wall', function(data) {
			io.output.write("Broadcast message from " + data.user);
			io.output.write(" ");
			io.output.write(sanitize(data.message));
			io.output.write(" ");
		});

		$.cookie("last-seen", new Date());
	}
};

$(document).ready(function()
{
	os.init();
});


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

	// Clear prompt while processing command.

	$("#user_prompt").html("");

	execute(command, arguments);
}

function execute(command, arguments)
{
	// Try and resolve with filesystem. I don't like this but I want to see how it works before hating it fully. 
	if(! fs.execute(command, arguments) )
	{
		// System level command searching. Should be in a system object or something, but lazzzzysauce.
		var cmd = COMMANDS.find[command];
		if(cmd)
		{
			cmd.execute(arguments);
		} else if(command != "")
		{
			io.output.writeError(command, "command not found");
		}
	}
}

function preparePrompt()
{
	io.input.prepare();

	setInterval(function()
	{
		$("#cursor").toggle();
	}, 600);

}

function fillPrompt(command_string)
{
	// tricky when needing to be multiple lines.

	$("#"+overflow_id).remove();

	while(command_string.length > 0)
	{
		command_line = command_string.substring(0, os.CONSOLE_WIDTH);
		command_string = command_string.substring(os.CONSOLE_WIDTH);

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




// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {

    var T, A, k;

    if (this == null) {
      throw new TypeError(" this is null or not defined");
    }

    // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (typeof callback !== "function") {
      throw new TypeError(callback + " is not a function");
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    if (thisArg) {
      T = thisArg;
    }

    // 6. Let A be a new array created as if by the expression new Array(len) where Array is
    // the standard built-in constructor with that name and len is the value of len.
    A = new Array(len);

    // 7. Let k be 0
    k = 0;

    // 8. Repeat, while k < len
    while(k < len) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
        kValue = O[ k ];

        // ii. Let mappedValue be the result of calling the Call internal method of callback
        // with T as the this value and argument list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

        // For best browser support, use the following:
        A[ k ] = mappedValue;
      }
      // d. Increase k by 1.
      k++;
    }

    // 9. return A
    return A;
  };      
}