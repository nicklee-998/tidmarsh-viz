/**
 * Created by marian_mcpartland on 14/12/15.
 */
function APManager()
{
	// 状态
	this._planeState = 0;       // 0 - hide, 1 - animating, 2 - grew
	this._animalState = 0;      // 0 - hide, 1 - animating, 2 - grew


	this._tilePerSide = 4;
	this._tileSizeX = groundWid / this._tilePerSide;
	this._tileSizeY = groundHei / this._tilePerSide;

	this._animatedObjects = 0;
	this._mountainMaps = [];

	// TREES
	this._treeColors = [
		[ 0x442c4c, 0x0f022e, 0x463964 ],
		[ 0x21b45c, 0x217b45, 0x06381a ],
		[ 0xffffff, 0xffb5c1, 0xffe1b5 ]
	];
	this._trees = [];

	// BIRDS
	this._morphs = [];
}

APManager.prototype.init = function()
{
	//Define if a tile is a mountain tile or not
	var maxMountainTiles = 5;
	for( var i = 0; i < this._tilePerSide; i++ ) {
		var row = [];
		for( var j = 0; j < this._tilePerSide; j++ ) {
			if(Math.round(Math.random())) {
				if( maxMountainTiles > 0 ) {
					maxMountainTiles--;
					row.push( 1 );
				} else {
					row.push( 0 );
				}
			} else {
				row.push( 0 );
			}
		}
		this._mountainMaps.push( row );
	}

	//Generate objects on tiles
	var maxTreePerTile = 3;
	for( var i = 0; i < this._tilePerSide; i++ ) {
		for( var j = 0; j < this._tilePerSide; j++ ) {
			if( this._mountainMaps[i][j] ) {
				//createMountainTile( i, j, 250 * Math.random() + 100, 4, 4, 0xff0000 );
			} else {
				var maxTreeOnThisTile = Math.round( maxTreePerTile * Math.random() );
				for( var k = 0; k < maxTreeOnThisTile; k++ ){
					this._createTree( i, j, this._treeColors[0][ Math.floor( Math.random() * this._treeColors.length ) ] );
				}
			}
		}
	}

	//this._growAnimation();
	this._initBirds();
}

APManager.prototype.showAP = function()
{
	this._planeState = 1;
	this._growAnimation();
	this._animalState = 1;
	this._showBirds();
}

APManager.prototype.hideAP = function()
{
	this._planeState = 1;
	this._hideAnimation();
	this._animalState = 1;
	this._hideBirds();
}

// -------------------------------------------------
//  Tree Animation
// -------------------------------------------------
APManager.prototype._createTree = function( tileX, tileZ, color )
{
	var trunkHeight = Math.random() * 50 + 15;
	var leafHeight = Math.random() * 100 + 100;
	var leafRadius = Math.random() * 30 + 15;

	var trunk = new THREE.Mesh(
		new THREE.CylinderGeometry( 3, 10, trunkHeight, 5, 1 ),
		new THREE.MeshLambertMaterial( { color: 0x342205, shading: THREE.FlatShading } )
	);
	trunk.position.y = trunkHeight / 2;

	var leaf = new THREE.Mesh(
		new THREE.CylinderGeometry( 0, leafRadius, leafHeight, 8, 1 ),
		new THREE.MeshLambertMaterial( { color: color, shading: THREE.FlatShading } )
	);
	leaf.castShadow = true;
	leaf.receiveShadow = true;
	leaf.position.y = leafHeight / 2 + trunk.position.y;

	var tree = new THREE.Object3D();
	tree.add( trunk );
	tree.add( leaf );

	tree.position.x = ( -this._tileSizeX * this._tilePerSide ) / 2 + ( this._tileSizeX * tileX ) + ( this._tileSizeX / 2 ) + ( Math.random() * this._tileSizeX ) - this._tileSizeX / 2;
	tree.position.y = ( -this._tileSizeY * this._tilePerSide ) / 2 + ( this._tileSizeY * tileZ ) + ( this._tileSizeY / 2 ) + ( Math.random() * this._tileSizeY ) - this._tileSizeY / 2;
	//tree.position.x = Math.random() * groundWid - groundWid / 2;
	//tree.position.y = -(Math.random() * groundHei - groundHei / 2);
	tree.position.z = 0;
	tree.rotation.x = Math.PI / 2;

	if( tree.position.x - leafRadius < -500 ){
		tree.position.x = -500 + leafRadius * 2;
	}
	else if( tree.position.x + leafRadius > 500 ){
		tree.position.x = 500 - leafRadius * 2;
	}

	if( tree.position.z - leafRadius < -500 ){
		tree.position.z = -500 + leafRadius * 2;
	}
	else if( tree.position.z + leafRadius > 500 ){
		tree.position.z = 500 - leafRadius * 2;
	}
	tree.rotation.y = degToRad( 360 * Math.random() );
	tree.visible = false;

	this._trees.push( tree );
	this._animatedObjects++;
	ground.add( tree );
}

APManager.prototype._growAnimation = function()
{
	var self = this;
	for( var i = 0; i < this._trees.length; i++ ) {
		var t = this._trees[ i ];
		var goalZ = 0;
		t.position.z = groundZero-100;
		t.scale.x = 0.0001;
		t.scale.z = 0.0001;
		t.visible = true;
		var delay = 0.02;
		var delay2 = 0.5;
		TweenMax.to( t.position, 1.7, { z: goalZ, delay: i * delay + delay2, ease:Elastic.easeOut, onComplete: function() {
			self._animatedObjects--;
			if(self._animatedObjects == 0) {
				self._planeState = 2;
				self._animatedObjects = self._trees.length;
			}
		}});
		TweenMax.to( t.scale, 1.7, { x: 1, z: 1, delay: i * delay + delay2, ease:Elastic.easeOut} );
		TweenMax.to( t.rotation, 1.7, { y: t.rotation.y + degToRad( 360 * Math.random() ), delay: i * delay + delay2} );
	}
}

APManager.prototype._hideAnimation = function()
{
	var self = this;

	// Kill all the animation first
	TweenMax.killAll();

	for( var i = 0; i < this._trees.length; i++ ){
		var t = this._trees[ i ];
		TweenMax.to( t.position, 0.7, { y: groundZero-250, delay: i * 0.05, ease:Cubic.easeOut, onComplete: function() {
			self._animatedObjects--;
			if(self._animatedObjects == 0) {
				self._planeState = 0;
				self._animatedObjects = self._trees.length;
			}
		}});
		TweenMax.to( t.scale, 0.5, { x: 0.0001, z: 0.0001, delay: i * 0.05, ease:Cubic.easeOut } );
	}
}

//APManager.prototype._objDestroyed = function()
//{
//
//	animatedObjects--;
//	if( animatedObjects == 0 ){
//		for( var i = 0; i < this._trees.length; i++ ){
//			var t = scene.getObjectById( this._trees[ i ].id );
//			scene.remove( t );
//		}
//	}
//}

// -------------------------------------------------
//  Bird Animation
// -------------------------------------------------
APManager.prototype._initBirds = function()
{
	var self = this;
	var loader = new THREE.JSONLoader();

	loader.load( "res/models/flamingo.js", function( geometry ) {
		self._morphColorsToFaceColors( geometry );
		self._addMorph( geometry, 500, 1000, 500 - Math.random() * 500, groundZero + 350, 40 );
	} );

	loader.load( "res/models/stork.js", function( geometry ) {

		self._morphColorsToFaceColors( geometry );
		self._addMorph( geometry, 350, 1000, 500 - Math.random() * 500, groundZero + 350, 340 );
	} );

	loader.load( "res/models/parrot.js", function( geometry ) {

		self._morphColorsToFaceColors( geometry );
		self._addMorph( geometry, 450, 500, 500 - Math.random() * 500, groundZero + 300, 700 );
	} );

}

APManager.prototype._showBirds = function()
{
	for ( var i = 0; i < this._morphs.length; i ++ ) {
		var morph = this._morphs[ i ];
		morph.material.opacity = 1;
	}
}

APManager.prototype._hideBirds = function()
{
	for ( var i = 0; i < this._morphs.length; i ++ ) {
		var morph = this._morphs[ i ];
		morph.material.opacity = 0;
		//TweenMax.to( morph.material, 700, { opacity: 0, ease:Cubic.easeOut } );
	}
}

APManager.prototype._addMorph = function(geometry, speed, duration, x, y, z, fudgeColor)
{
	var material = new THREE.MeshLambertMaterial( { color: 0xffffff, morphTargets: true, vertexColors: THREE.FaceColors} );
	material.transparent = true;

	if ( fudgeColor ) {
		material.color.offsetHSL( 0, Math.random() * 0.5 - 0.25, Math.random() * 0.5 - 0.25 );
		material.ambient = material.color;
	}

	var meshAnim = new THREE.MorphAnimMesh( geometry, material );

	meshAnim.speed = speed;
	meshAnim.duration = duration;
	meshAnim.time = 600 * Math.random();

	meshAnim.position.set( x, y, z );
	meshAnim.rotation.y = Math.PI/2;

	meshAnim.castShadow = true;
	meshAnim.receiveShadow = true;

	scene.add( meshAnim );

	this._morphs.push( meshAnim );
}

APManager.prototype._morphColorsToFaceColors = function( geometry )
{
	if ( geometry.morphColors && geometry.morphColors.length ) {

		var colorMap = geometry.morphColors[ 0 ];
		for ( var i = 0; i < colorMap.colors.length; i ++ ) {
			geometry.faces[ i ].color = colorMap.colors[ i ];
		}
	}
}

APManager.prototype.update = function()
{
	var delta = clock.getDelta();

	for ( var i = 0; i < this._morphs.length; i ++ ) {
		var morph = this._morphs[ i ];
		morph.updateAnimation( 1000 * delta );
		morph.position.x += morph.speed * delta;

		if ( morph.position.x  > 2000 )  {
			morph.position.x = -1000 - Math.random() * 500;
		}
	}
}