

var fs = 
{
	stack: [],
	root: [],
	currentElement: function()
	{
		if(fs.stack.length == 0)
		{
			obj = fs.makeRootElement();
		} else
		{
			obj = fs.stack[fs.stack.length - 1];
		}


		return obj;
	},
	makeRootElement: function()
	{
		obj = {};
		obj.children = {};
		obj.execute = function() { return false; };
		$.each(fs.root, function(i, value)
		{
			obj.children[value.handle] = value;
		});

		return obj;
	},
	execute: function(cmd, args)
	{
		console.log(cmd);
		console.log(args);
		switch(cmd)
		{
			case "ls": 
				io.output.write("");

				executed = false;

				// If no arguments are passed, current working directory.
				if(args == "")
				{
					executed = fs.currentElement().execute("ls");
				} else
				{
					element = fs.getElementAtPath(args);

					if(element)
					{
						executed = element.execute("ls");

						if(!executed)
						{
							executed = true;
							$.each(element.children, function(i, value)
							{
								out = i;
								if(value.type == "directory")
									out += "/";

								io.output.write(out);
							});
						}
					}
						
				}
				

				if(!executed)
				{
					// Default ls behaviour
					if(!executed)
					{
						$.each(fs.currentElement().children, function(i, value)
						{
							console.log(value);
							out = i;
							if(value.type == "directory")
								out += "/";

							io.output.write(out);
						});
					}
				}
				
				break;
			case "cd": 
				temp_stack = fs.getStackForPath(args);
				
				if(temp_stack)
				{
					if(temp_stack.length == 0 || temp_stack[temp_stack.length - 1].type == "directory" )
						fs.stack = temp_stack;
					else
						io.output.writeError(cmd, args + ": Not a directory.");
				} else
				{
					io.output.writeError(cmd, args + ": No such file or directory");
				}
				break;
			case "pwd": 
				io.output.write(fs.pwd());
				break;
			case "cat":
				temp_stack = fs.getStackForPath(args);

				if(temp_stack)
				{
					if(temp_stack.length == 0 || temp_stack[temp_stack.length - 1].type == "directory" )
						io.output.writeError(cmd, args + ": Is a directory.");
					else
					{
						console.log(temp_stack);
						temp_stack[temp_stack.length - 1].cat();
					}
						
				} else
				{
					io.output.writeError(cmd, args + ": No such file or directory");
				}

				break;
			default:
			 	return false;	
		}

		return true;
	},
	pwd: function()
	{
		ret = "/" + fs.stack.map(function(arg) { return arg.handle }).join("/");

		return ret;
	},
	qualify_path: function(path)
	{
		
	},
	addRootItem: function(item)
	{
		item.init();
		fs.root.push(item);
	},
	getStackForPath: function(path)
	{

		temp_stack = jQuery.extend(true, [], fs.stack);


		if(path[0] == "/")
			temp_stack = [];
		
		path = path.split("/").filter(function(elem) { return elem != "" });

		if(path.length == 0)
		{
			temp_stack.push(fs.makeRootElement());
		} else
		{
			$.each(path, function(index, value)
			{
				switch(value)
				{
					case "..":
						temp_stack.pop();
						break;
					case "":
					case ".":
						break;
					default: 
						if(temp_stack && temp_stack.length != 0)
							next = temp_stack[temp_stack.length - 1].children[value];
						else
						{
							next = fs.makeRootElement().children[value];
						}

						if(next)
						{
							temp_stack.push(next);
						} else
						{
							temp_stack = false;
							return false;
						}
							
						break;
				}
			});
		}
		

		return temp_stack;
	},
	getElementAtPath: function(path)
	{
		stack = fs.getStackForPath(path);
		element = null;

		if(stack && stack.length > 0)
			element = stack[stack.length - 1];

		return element;
	},
	tryComplete: function(path)
	{
		ret = false;
		index = path.lastIndexOf("/");

		if(index != -1)
		{
			fuzzyPath = path.substring(0, index);
			incompleteHandle = path.substring(index + 1, path.length);
		} else
		{
			fuzzyPath = fs.pwd();
			incompleteHandle = path;
		}

		element = fs.getElementAtPath(fuzzyPath)

		if(element)
		{
			$.each(element.children, function(i, child)
			{
				if(child.handle.indexOf(incompleteHandle) == 0)
				{
					ret = child.handle;
					return false; 
				}
			});
		}
		
		return ret;
	}
}


// prototypical filesystem object interface. 
var blog = 
{
	handle: "blog",
	children: {},
	type: "directory",
	contents: "",
	init: function()
	{
		// Load the feed data. 

		// Very cool google tool that takes an RSS feed and converts it into JSON.
		$.ajax({
		    url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&callback=?&q=' + "http://blog.con.rs/?feed=rss2",
		    dataType: 'json',
		    success: function(data) {
		     	entries = data.responseData.feed.entries;

		     	$.each(entries, function(i, entry)
		     	{
		     		console.log(entry);
		     		handle = entry.title.replace(/\s/g, '_');
		     		handle = handle.replace(/\W/g, '');
		     		obj = {};
		     		obj.handle = handle;
		     		obj.contents = stripHTML(entry.content);
		     		obj.cat = function() { io.output.write(this.contents); };

		     		blog.children[obj.handle] = obj;
		     	});
		    }
  		});
		
	},
	destroy: function()
	{

	},
	cat: function()
	{	
	},	
	execute: function(command, args)
	{
		return false;
	},
	get: function(handle)
	{

	}
}

fs.addRootItem(blog);

var other = jQuery.extend(true, {}, blog);

other.handle = "cat";
fs.addRootItem(other);
function stripHTML(html)
{
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}








