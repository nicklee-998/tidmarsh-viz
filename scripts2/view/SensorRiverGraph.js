/**
 * Created by marian_mcpartland on 15/4/21.
 */

function SensorRiverGraph()
{
	this._deviceId;
	this._start;
	this._end;
}

SensorRiverGraph.prototype.genGraph = function(did, st, ed)
{
	this._deviceId = did;
	this._start = st;
	this._end = ed;


}

SensorRiverGraph.prototype.saveGraph = function()
{

}