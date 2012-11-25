<?PHP
require_once("Pusher.php");

$pusher = new Pusher("c5ba61579edbf533d0fe", "07fd14a2b945d86fb21b", 32339);

$message["user"] = $_REQUEST['user'];
$message["message"] = $_REQUEST['message'];

$pusher->trigger('comm', 'wall', $message);

?>