<?PHP
require_once("Pusher.php");
require_once("config.php");

$PUSHER_KEY = "1cd61253e47ce70d1a4e";
$PUSHER_SECRET = "42ef9df15581c82b023e";
$PUSHER_APP_ID = "53671";

$pusher = new Pusher($PUSHER_KEY, $PUSHER_SECRET, $PUSHER_APP_ID);

$message["user"] = $_REQUEST['user'];
$message["message"] = $_REQUEST['message'];

$pusher->trigger('comm', 'wall', $message);

?>