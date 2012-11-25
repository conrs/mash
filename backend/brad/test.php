<?PHP
require_once("Pusher.php");

$pusher = new Pusher("c5ba61579edbf533d0fe", "07fd14a2b945d86fb21b", "xxx", true, "54.235.244.144", "4567");

$pusher->trigger('my-channel', 'my_event', 'hello world');

?>