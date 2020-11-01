//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import {
    LightProbeGenerator
} from './libs/LightProbeGenerator.js';



import {
    params
} from './ui.js';


import {
    createMeshes,
    guiMeshUpdate,
    meshUpdate
} from './mesh.js'


import {
    pmremGenerator
} from './app.js';



//variables we will export
let camera;
let scene;





let lightProbe;
let directionalLight;

let time = 0.;


//Camera and Lights
//=============================================


function createCamera() {



     camera
     camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
     camera.position.set(0, 40, 60);

}




function createLights() {

    // light probe
    lightProbe = new THREE.LightProbe();
    lightProbe.intensity = 2. * params.intensity;
    scene.add(lightProbe);



    // normal light
    directionalLight = new THREE.DirectionalLight(0xffffff, 2. * params.intensity);
    directionalLight.position.set(10, 10, 10);
    //directionalLight.castShadow = true;
    scene.add(directionalLight);



}








//Build the Scene
//=============================================





//=====if we have a generated background in a white cube

function createEnvScene() {

    var envScene = new THREE.Scene();

    var geometry = new THREE.BoxBufferGeometry();
    geometry.deleteAttribute('uv');
    var roomMaterial = new THREE.MeshStandardMaterial({
        metalness: 0,
        side: THREE.BackSide
    });
    var room = new THREE.Mesh(geometry, roomMaterial);
    room.scale.setScalar(10);
    envScene.add(room);

    var mainLight = new THREE.PointLight(0xffffff, 30, 0, 2);
    envScene.add(mainLight);

    var lightMaterial = new THREE.MeshLambertMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveIntensity: 20
    });

    var light1 = new THREE.Mesh(geometry, lightMaterial);
    light1.material.color.setHex(0xF52A5E);
    light1.position.set(-5, 2, 0);
    light1.scale.set(0.1, 1, 1);
    envScene.add(light1);

    var light2 = new THREE.Mesh(geometry, lightMaterial.clone());
    light2.material.color.setHex(0xF5E836);
    light2.position.set(5, 3, 0);
    light2.scale.set(1, 0.1, 1);
    envScene.add(light2);

    var light3 = new THREE.Mesh(geometry, lightMaterial.clone());
    light3.material.color.setHex(0x35C4F5);
    light3.position.set(2, 1, 5);
    light3.scale.set(1, 1, 0.1);
    envScene.add(light3);





    //===== now have generated the scene:
    //build the cube map fom this:

    var generatedCubeRenderTarget = pmremGenerator.fromScene(envScene, 0.04);


    scene.background = generatedCubeRenderTarget.texture;

    return generatedCubeRenderTarget.texture;



}









function createEnvFromCube() {
    // envmap
    let genCubeUrls = function (prefix, postfix) {

        return [
						prefix + 'px' + postfix, prefix + 'nx' + postfix,
						prefix + 'py' + postfix, prefix + 'ny' + postfix,
						prefix + 'pz' + postfix, prefix + 'nz' + postfix
					];

    };

    let urls = genCubeUrls('./textures/bridge/', '.jpg');

    return new THREE.CubeTextureLoader().load(urls, function (cubeTexture) {

        cubeTexture.encoding = THREE.sRGBEncoding;

        scene.background = cubeTexture;

        lightProbe.copy(LightProbeGenerator.fromCubeTexture(cubeTexture));

    });



}






//Making Updates
//=============================================



function guiSceneUpdate() {
    lightProbe.intensity = 2. * params.intensity;
    directionalLight.intensity = 2. * params.intensity;
}



//Functions to Be Exported
//=============================================



function createScene() {
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0x8FBCD4);

    createCamera();
    createLights();

    //this includes create meshes


    //choose if the background is loaded from a cube map or generated
    //let cubeTex = createEnvFromCube();
    let cubeTex = createEnvScene();


    createMeshes(cubeTex);


}



function updateScene() {

    time += 0.01;

    guiSceneUpdate();
    guiMeshUpdate();
    meshUpdate(time);


}





//Export Stuff
//=============================================
export {
    scene,
    camera,
    createScene,
    updateScene
};
