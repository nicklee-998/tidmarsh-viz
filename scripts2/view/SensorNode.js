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

	this._onlineTimer = null;
	this._onlineCounter;
	this.ONLINE_TOTAL_TIME = 600;   // 单位：秒
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
}

SensorNode.prototype.online = function(val)
{
	var self = this;

	if(val) {
		// online
		this._mesh.material.color.setHex("0xff0000");

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
				}
			}, 1000);
		}
	} else {
		// offline
		this._mesh.material.color.setHex("0x666666");
	}
}