/**
 * Created by marian_mcpartland on 14/12/16.
 */

function getRandomArbitrary(min, max)
{
	return Math.random() * (max - min) + min;
}

function getRandomInt(min, max)
{
	return Math.floor(Math.random() * (max - min)) + min;
}

function degToRad( deg )
{
	return (deg * ( Math.PI / 180));
}