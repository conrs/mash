

var fs = 
{
	stack: [],
	execute: function(cmd)
	{
		switch(cmd)
		{
			case "email":
				alert("wut");

			break;


			default:
			 	return false;	
		}

		return true;
	},
	pwd: function()
	{
		return "/" + fs.stack.join("/") + "/";
	},
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