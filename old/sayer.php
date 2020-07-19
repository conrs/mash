<?php
$text = $_REQUEST['text'];
$autoplay = isset($_REQUEST['autoplay']) ? $_REQUEST['autoplay'] : 0;

$words = explode(" ", $text);
$links = array();

foreach($words as $word)
{
	$word = preg_replace("/\W*/", "", $word);
	$href = getHref($word);
	trackWord($word, $href);

	if($href != null)
	{
		$tmp = new stdClass();
		$tmp->word = $word;
		$tmp->href = $href; 

		$links[] = $tmp;
	}

}

if($autoplay)
{
	outputPretty($_REQUEST['text'], $links);
} else
{
	echo json_encode($links);
	die();
}

function trackWord($word)
{
	return false;
}


function getHref($word)
{
	header("Content-type: text/plain");
	$url = "http://dictionary.reference.com/browse/$word";

	$contents = file_get_contents($url);

	$mp3s = preg_match("/<source src=\"(.*?\.ogg)\"/", $contents, $matches);

	return $matches[1];
}
/*
function outputPretty($words, $links)
{
	?>
	<html>
		<head>
			<title> Wow, this thing sucks </title>
		</head>
		<body>
			<input id='word_input'type='text' value='<?php echo $words;?>'>
}
*/


?>