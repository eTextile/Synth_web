let e256_matrix = new matrix(256);

let camera, scene, renderer;
let geometry, material, plane;
let points;
var myWidth, myHeight;

const myCanvas = document.getElementById("myScene");

window.addEventListener('resize', function(event){
  myWidth = myCanvas.offsetWidth;
  myHeight = myCanvas.offsetHeight;
  renderer.setSize(myWidth, myHeight, false);
  camera.aspect = myWidth / myHeight;
  camera.updateProjectionMatrix();
});

function init() {
  myWidth = myCanvas.offsetWidth;
  myHeight = myCanvas.offsetHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('white');

  renderer = new THREE.WebGLRenderer({antialias: true, canvas: myCanvas});
  //renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(myWidth, myHeight);

  geometry = new THREE.PlaneBufferGeometry(15, 15, 15, 15);
  material = new THREE.MeshBasicMaterial({wireframe: true, color: "blue"});
  plane = new THREE.Mesh(geometry, material);
  points = new THREE.Points(geometry, new THREE.PointsMaterial({size: 0.2, color: "red"}));
  plane.add(points);
  scene.add(plane);

  camera = new THREE.PerspectiveCamera(45, myWidth / myHeight, 1, 1000);
  camera.position.set(0, 0, 20);

  renderer.setAnimationLoop(animate);
}

function animate() {
  for(let i = 0; i<256; i++){
    geometry.attributes.position.setZ(i, e256_matrix.Z(i+1));
  }
  geometry.attributes.position.needsUpdate = true;
	renderer.render(scene, camera);
}

init();