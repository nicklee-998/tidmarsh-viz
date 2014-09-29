// JavaScript Document
function DataFactory()
{
	this.dataset = null;
}

DataFactory.prototype.restore = function()
{
	this.dataset = new Array();
}

DataFactory.prototype.addData = function(did, sid, dobj)
{
	var set = this._getListById(did, sid);
	if(set == null) {
		set = {did:did, sid:sid, datas:new Array()};
		this.dataset.push(set);
	}
	set.datas.unshift(dobj);
}

DataFactory.prototype.getDatas = function(did, sid)
{
	var valist = null;
	for(var i = 0; i < this.dataset.length; i++) {
		var obj = this.dataset[i];
		if(obj.did == did && obj.sid == sid) {
			valist = obj.datas;
			break;
		}
	}
	return valist;
}

DataFactory.prototype.findData = function(did, sid, date)
{
	var valist = null;
	for(var i = 0; i < this.dataset.length; i++) {
		var obj = this.dataset[i];
		if(obj.did == did && obj.sid == sid) {
			valist = obj.datas;
			break;
		}
	}
	
	if(valist == null)
		return null;
	
	var vobj = null;
	for(var i = valist.length-1; i >= 0; i--) {
		var dat = valist[i];
		var st = new Date(dat.timestamp);
		var ed = new Date(dat.timestamp);
		ed.setSeconds(ed.getSeconds() + 20);
		
		if(date > st && date < ed) {
			vobj = {did:did, sid:sid, value:dat.value};
			break;
		}
	}
	if(vobj == null)
		vobj = {did:did, sid:sid, value:0};
	
	return vobj;
}

DataFactory.prototype._getListById = function(did, sid)
{
	for(var i = 0; i < this.dataset.length; i++) {
		var obj = this.dataset[i];
		if(obj.did == did && obj.sid == sid) {
			return obj;
		}
	}
	return null;
}