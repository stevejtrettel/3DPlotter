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


//variables we will export
let camera;
let scene;





let lightProbe;
let directionalLight;

let time = 0.;


//Camera and Lights
//=============================================


function createCamera() {
    // camera
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 20, 50);


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

function createEnvironment() {
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
    let cubeTex = createEnvironment();
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
