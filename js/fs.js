/* 
Filesystem: Keeps track of current working directory (tied into prompt).

First stabs: Files will either contain files or execute a function. Both should have .open() functions; the behavior of a directory
will modify the current working directory while the behaviour of a normal file will simply output its "contents". 

Alt: we forward commands to files if they have to do with the filesystem. e.g.

ls (will behave on the current directory if no args), so have the filesystem implement a "ls" function. 
cat (needs an argument) =---------------------------- ^ "cat"

cd modifies the filesystems current directory. relative paths. etc. 
TAB COMPLETION WOULD BE COOL....


*/


var fs = 
{
	pwd: "/home/matt/",
	homedir: "/home/matt/",
	cd: function(path)
	{

	},
	qualify_path: function(path)
	{
		tokens = path.split("/");
		var curr_full_path = "";

		if(path.charAt(0) == "/")
			return path;
		else if(tokens[0] == "~")
		{
			tokens.splice(0, 1);
			curr_full_path = fs.homedir; 
		} else 
		{
			curr_full_path = fs.pwd;
		} 

		for(var i in tokens)
		{
			var piece = tokens[i];

			switch(piece)
			{
				case ".":
					curr_full_path = curr_full_path;
					break;
				case "~":
					return null;
					break;
				case "..":
					curr_full_path = curr_full_path.substring(0, curr_full_path.substring(0, curr_full_path.lastIndexOf("/")).lastIndexOf("/") + 1);
					if(curr_full_path == "")
						curr_full_path = "/";
					break;
				default: 
					if(piece != "")
					{
						if(curr_full_path.charAt(curr_full_path.length - 1) != "/")
							curr_full_path += "/";

						curr_full_path += piece;
					} else
					{
						if(curr_full_path.charAt(curr_full_path.length - 1) != "/")
							curr_full_path += "/";
					}
						
					break;
			}
		}
		return curr_full_path;
	}
}

var element = 
{
	type: "file", 
	cat: function()
	{

	}
}