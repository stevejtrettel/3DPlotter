////Import Stuff, Variables
////=============================================
import * as THREE from './libs/three.module.js';

import {
    params
} from './ui.js';


import {
    scene
} from './scene.js';


import {
    // acceleration,
    surfaceParamsUpdate,
    // surface,
    rescaleU,
    rescaleV,
    equationUpdate
} from './surface.js';


import {
    state,
    dState,
    createParametricSurface,
    createGeodesicSpray
} from './geometry.js';



//let meshes;






//internal variables
let geometry;
let material;
let texMaterial;
let colorMaterial;
let curveMaterial;
let parametricMesh;

//let points;
//let curve;
let curveMesh;


//let startBall, endBall;
//let startBallMesh, endBallMesh;







//gives the initial condition as a function of time
//n is the number of curve we are on
function initialCondition(t, n) {
    let pv = rescaleV(params.p);
    let wiggle = params.wiggle / 10;
    //==== INITIAL POSITION

    //start from center
    let pos = new THREE.Vector2(3.14, pv + 3.14 / 8.);

    //start from a corner
    //let pos = new THREE.Vector2(uMin + uRng / 8, vMin + uRng / 8);


    //===== SPACING
    let spacing = 3.14 / 90;

    //rotate back and forth
    //let theta = 3.14 / 8. * (Math.sin(t / 3) + 1) + 3.14 / 8 + n * 3.14 / 90;

    //rotate in a circle
    //let theta = t / 5 + n * spacing;

    //control angle with slider
    let theta = params.angle + n * spacing + Math.cos(t) * wiggle;

    //assemble the velocity vector
    let vel = new THREE.Vector2(Math.cos(theta), Math.sin(theta));

    return new state(pos, vel);
}









//Textured Surface
//=============================================
// create a texture loader.
const textureLoader = new THREE.TextureLoader();

// Load a texture. See the note in chapter 4 on working locally, or the page
const texture = textureLoader.load('./textures/Grid.png');

// set the "color space" of the texture
texture.encoding = THREE.sRGBEncoding;
// reduce blurring at glancing angles
texture.anisotropy = 16;


//boolean to decide if we draw the texture
let drawTex = params.drawTex;


//determine if we add a picture texture based on 
function addTexture(value) {
    if (value == 1) {
        return texture;
    } else {
        return null;
    }
}




//Meshes
//=============================================

function createMeshes(cubeTexture) {
    //set the parameters
    surfaceParamsUpdate();
    equationUpdate();
    //CREATE THE MATERIALS 


    curveMaterial = new THREE.MeshStandardMaterial({
        color: 0x1e43,
        metalness: params.metal,
        roughness: params.rough,
        envMap: cubeTexture,
        envMapIntensity: 1.,
        side: THREE.DoubleSide,
    });


    colorMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: params.metal,
        roughness: params.rough,
        envMap: cubeTexture,
        envMapIntensity: 1.,
        side: THREE.DoubleSide,
    });


    texMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: texture,
        metalness: params.metal,
        roughness: params.rough,
        envMap: cubeTexture,
        envMapIntensity: 1.,
        side: THREE.DoubleSide,
    });

    if (drawTex == 1) {
        material = texMaterial;
    } else {
        material = colorMaterial;
    }


    //CREATE THE GEOMETRIES

    //parametric surface geometry
    geometry = createParametricSurface(0);

    parametricMesh = new THREE.Mesh(geometry, material);
    parametricMesh.position.set(0, 0, 0);
    scene.add(parametricMesh);



    //make curve based on u,v coordinates;
    //geometry = createGeodesic(0, 0);
    geometry = createGeodesicSpray(0, params.spray);


    curveMesh = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curveMesh);


}





function guiMeshUpdate() { //all the gui updates


    surfaceParamsUpdate();

    //
    //update the mesh graphics parameters;
    parametricMesh.material.metalness = params.metal;
    parametricMesh.material.roughness = params.rough / 4.;
    parametricMesh.material.color.set(params.color);

    curveMesh.material.color.set(params.curveColor);
    curveMesh.material.metalness = params.metal;
    curveMesh.material.roughness = params.rough / 4.;

    //drawTex = params.drawTex;

    //decide based on the boolean drawTex
    if (params.drawTex == 1) {
        parametricMesh.material = texMaterial;
    } else {
        parametricMesh.material = colorMaterial;
    }




}


function meshRotate(theMesh) {


    //updates to the meshes in the scene
    theMesh.rotation.y += params.zRotation / 100 + params.tumble / 100;

    theMesh.rotation.x += params.tumble / 100;
    theMesh.rotation.z += params.tumble / 100;
}





function meshUpdate(currentTime) {


    //update the equations coming from the GUI
    equationUpdate();

    //updates to the meshes in the scene
    meshRotate(parametricMesh);
    meshRotate(curveMesh);


    // wiggle the parametric mesh
    parametricMesh.geometry.dispose();
    parametricMesh.geometry = createParametricSurface(currentTime);


    // wiggle the curve mesh
    curveMesh.geometry.dispose();
    curveMesh.geometry = createGeodesicSpray(currentTime, params.spray);



}




export {
    initialCondition,
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
