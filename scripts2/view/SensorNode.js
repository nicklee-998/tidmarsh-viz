/**
 * Created by marian_mcpartland on 15/1/12.
 */
function SensorNode(model, title)
{
	this.title = title;
	this.mesh = model;

	this._part01 = model.getObjectByName("_065T_0A-1Imported1", true).children[0];
	this._part02 = model.getObjectByName("_065B_0A-1Boss-Extrude3", true).children[0];
	this._part01.material = new THREE.MeshPhongMaterial({color: 0x404040, shading: THREE.FlatShading});
	this._part02.material = new THREE.MeshPhongMaterial({color: 0x404040, shading: THREE.FlatShading});
	this._part01.userData = {"title": title, "host": this};
	this._part02.userData = {"title": title, "host": this};
}

SensorNode.prototype.mouseOver = function()
{
	this._part01.material.emissive.setHex(0xff0000);
	this._part02.material.emissive.setHex(0xff0000);
}

SensorNode.prototype.mouseOut = function()
{
	this._part01.material.emissive.setHex(0x404040);
	this._part02.material.emissive.setHex(0x404040);
}