// JavaScript Document
function GmapGhost(vertice) 
{
	this.state = GHOST_STATE_SLEEP;		// SLEEP, ACTIVE, WANDER, DISABLE
	
	this.wanderSpeed = 0.02;

	this._origX = vertice[0];
	this._origY = vertice[1];
	this._currX = vertice[0];
	this._currY = vertice[1];
	this._targetX = 0;
	this._targetY = 0;
	this._isAnimation = false;
	
	this._animIdx = 1;
	this._animEnd = 1;
	this._interval = 0.01;	
	this._vertice = vertice;
	
	this._scaleX;
	this._scaleY;
	
	this._infoObj;
}

GmapGhost.prototype.active = function(tx, ty, iobj)
{
	this.state = GHOST_STATE_ACTIVE;
	
	this._animIdx = 0;
	this._animEnd = 1;
	this._targetX = tx;
	this._targetY = ty;
	this._scaleX = d3.scale.linear().domain([0, 1]).range([this._currX, this._targetX]).clamp(true);
	this._scaleY = d3.scale.linear().domain([0, 1]).range([this._currY, this._targetY]).clamp(true);
	this._isAnimation = true;
	
	this._infoObj = iobj;
}

GmapGhost.prototype.wander = function()
{
	// let the point wander...
	this.state = GHOST_STATE_WANDER;
	
	this._animIdx = 0;
	this._interval = 0.02;
	//this._currX = this._targetX;
	//this._currY = this._targetY;
	this._targetX += (Math.random() - 0.5);
	this._targetY += (Math.random() - 0.5);
	this._scaleX = d3.scale.linear().domain([0, 1]).range([this._currX, this._targetX]).clamp(true);
	this._scaleY = d3.scale.linear().domain([0, 1]).range([this._currY, this._targetY]).clamp(true);
}

GmapGhost.prototype.update = function()
{
	if(this._animIdx >= this._animEnd) {
		
		if(this.state == GHOST_STATE_SLEEP || this.state == GHOST_STATE_DISABLE) {
			this._isAnimation = false;
			return;
		} else {
			this.wander();
			
			if(this._isAnimation) {
				// ----------------------------
				// 发送动画完毕事件
				// ----------------------------	
				jQuery.publish(GHOST_ANIM_COMPLETE, this._infoObj);
					
				this._isAnimation = false;
				return;
			}
		}	
	}
			
	this._currX = this._scaleX(this._animIdx);
	this._currY = this._scaleY(this._animIdx);
	//console.log("curr: " + this._currX + ", " + this._currY);
	
	this._vertice[0] = this._currX;
	this._vertice[1] = this._currY;
			
	this._animIdx += this._interval;
}

GmapGhost.prototype.sleep = function()
{
	this.state = GHOST_STATE_SLEEP;
	
	// go back to origin position
	this._goBack();
}

GmapGhost.prototype.disable = function()
{
	this.state = GHOST_STATE_DISABLE;
	
	// go back to origin position
	if(this._currX != this.origX && this._currY != this.origY)
		this._goBack();
}

GmapGhost.prototype._goBack = function()
{
	this._animIdx = 0;
	this._animEnd = 1;
	this._targetX = this._origX;
	this._targetY = this._origY;
	this._scaleX = d3.scale.linear().domain([0, 1]).range([this._currX, this._targetX]).clamp(true);
	this._scaleY = d3.scale.linear().domain([0, 1]).range([this._currY, this._targetY]).clamp(true);
	this._isAnimation = true;
	
	this._infoObj = {did:'', sid:'', msg:'', value:0};
}
