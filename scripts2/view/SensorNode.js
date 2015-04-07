/**
 * Created by marian_mcpartland on 15/1/12.
 */
function SensorNode(title)
{
	this._title = title;
	this._mesh = new THREE.Mesh(
		new THREE.CylinderGeometry(10, 10, 12, 10),
		new THREE.MeshPhongMaterial({color: 0x666666, shading: THREE.FlatShading})
	);

	// default style
	this._normalColor = this._mesh.material.color.getHex();
	this._originEmissive = this._mesh.material.emissive.getHex();

	this._lastUpdated = null;

	// timer
	this._onlineTimer = null;
	this._onlineCounter;
	this.ONLINE_TOTAL_TIME = 30;   // 单位：秒

	// color
	var c1 = "hsl(0, 0%, 40%)";
	var c2 = "hsl(120, 70%, 45%)";
	this._colorScale = d3.scale
		.linear()
		.domain([0, this.ONLINE_TOTAL_TIME])
		.range([c1, c2])
		.interpolate(d3.interpolateHsl);
}

SensorNode.prototype.isOnline = function(date)
{
	var now = new Date();
	var interval = (now - date) / 60000;    // 单位：分钟

	if(interval > 10) {
		this.online(false);
	} else {
		this.online(true);
	}

	// just record now...
	this._lastUpdated = date;
}

SensorNode.prototype.online = function(val)
{
	var self = this;

	if(val) {
		// online
		var clr = this._colorScale(this.ONLINE_TOTAL_TIME).toString();
		clr = "0x" + clr.substring(1);
		this._mesh.material.color.setHex(clr);

		// set on timer
		this._onlineCounter = this.ONLINE_TOTAL_TIME;
		if(this._onlineTimer == null) {
			this._onlineTimer = setInterval(function() {
				if(self._onlineCounter == 0) {
					self.online(false);
					clearInterval(self._onlineTimer);
					self._onlineTimer = null;
				} else {
					self._onlineCounter--;

					var clr = self._colorScale(self._onlineCounter).toString();
					clr = "0x" + clr.substring(1);
					self._mesh.material.color.setHex(clr);
				}
			}, 1000);
		}
	} else {
		// offline
		var clr = this._colorScale(0).toString();
		clr = "0x" + clr.substring(1);
		this._mesh.material.color.setHex(clr);
	}
}

SensorNode.prototype.selected = function(color)
{
	var clr = color.toString();
	clr = "0x" + clr.substring(1);
	//this._mesh.material.color.setHex("0xff0000");
	this._mesh.material.color.setHex(clr);
}

SensorNode.prototype.deselected = function()
{
	this._mesh.material.color.setHex("0x666666");
}

SensorNode.prototype.restore = function()
{
	this._mesh.material.color.setHex(this._normalColor);
	this._mesh.material.emissive.setHex(this._originEmissive);
}