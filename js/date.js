Date.prototype.weekday = function()
{
	var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	return days[this.getDay()];
}

Date.prototype.month = function()
{
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	return months[this.getMonth()];
}

Date.prototype.time24 = function()
{
	var hours = "" + this.getHours();
	var minutes = "" + this.getMinutes();
	var seconds = "" + this.getSeconds();

	if(hours.length < 2)
		hours = "0"+hours;

	if(minutes.length < 2)
		minutes = "0"+minutes;

	if(seconds.length < 2)
		seconds = "0"+seconds;


	return hours+":"+minutes+":"+seconds;
}




