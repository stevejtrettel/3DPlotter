//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import { //for merging buffer geometries
    BufferGeometryUtils
} from './libs/BufferGeometryUtils.js';

import {
    params
} from './ui.js';


import {
    scene
} from './scene.js';


import {
    curveSpray,
    sphCoords,
    nilGeodesic,
    nilFlow
} from './geometry.js';

let meshes;






//internal variables
let geometry;
let material;
let texMaterial;
let colorMaterial;
let curveMaterial;
let parametricMesh;


let curve;
let curveMesh;

//
//let startBall, endBall;
//let startBallMesh, endBallMesh;
//


let velList;
let curves;
let geodesicGroup;


let curve0, curve1, curve2, curve3, curve4, curve5;
let curve6, curve7, curve8, curve9, curve10;


function initialCondition(t) {

    let wiggle = params.wiggle;

    let phi = params.angle + 0.4 * wiggle * Math.cos(2 * t);
    let theta = params.theta + wiggle * Math.sin(t);

    return sphCoords(phi, theta);
}



function velSpray(v, rings, spokes) {
    //make a list of initial conditions
    //they form concentric rings about v
    //number of rings is RINGS: number in each ring is SPOKES

    let velList = [];
    let u, w;

    //find a perpendicular vector to v
    let n = new THREE.Vector3(0, -v.z, v.y).normalize();

    //to get a point on each ring, rotate about w by some perscribed angle:

    for (let i = 1; i < rings; i++) {
        //rotate some angle away from v
        w = v.clone().applyAxisAngle(n, 0.3 * i);
        velList.push(w);
        for (let j = 1; j < spokes; j++) {
            //rotate successively around v;
            u = w.clone().applyAxisAngle(v, 6.28 * (j / spokes));
            velList.push(u);
        }


    }

    return velList;
}



function singleRing(v, t) {

    let velList = [];

    //add the central vector
    velList.push(v);


    let u, w;
    let U, W;

    //find a perpendicular vector to v
    const n = new THREE.Vector3(0, -v.z, v.y).normalize();


    //first ring around the central vector
    w = v.clone().applyAxisAngle(n, params.spray);
    W = v.clone().applyAxisAngle(n, 2 * params.spray);

    for (let j = 0; j < 5; j++) {
        //rotate successively around v;

        u = w.clone().applyAxisAngle(v, t + 6.28 * (j / 5));
        U = W.clone().applyAxisAngle(v, t + 6.28 * (j / 5));

        velList.push(u);
        velList.push(U);
    }


    return velList;

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
    //surfaceParamsUpdate();

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


    //    texMaterial = new THREE.MeshStandardMaterial({
    //        color: 0xffffff,
    //        map: texture,
    //        metalness: params.metal,
    //        roughness: params.rough,
    //        envMap: cubeTexture,
    //        envMapIntensity: 1.,
    //        side: THREE.DoubleSide,
    //    });
    //
    //    if (drawTex == 1) {
    //        material = texMaterial;
    //    } else {
    //        material = colorMaterial;
    //    }


    //central sphere
    geometry = new THREE.SphereBufferGeometry(3, 32, 32);
    parametricMesh = new THREE.Mesh(geometry, colorMaterial);
    scene.add(parametricMesh);



    //    //geodesic spray
    //    velList = velSpray(new THREE.Vector3(0, 0, 1), 10, 20);
    //    curves = curveSpray(velList);
    //    geodesicGroup = new THREE.Group();
    //
    //    for (let i = 0; i < curves.length; i++) {
    //        geometry = new THREE.TubeBufferGeometry(curves[i], 5 * params.length, 0.2, 15, false);
    //        curveMesh = new THREE.Mesh(geometry, curveMaterial);
    //        geodesicGroup.add(curveMesh);
    //    }
    //
    //    scene.add(geodesicGroup);
    //
    //




    //instead of a giant spray, just a single ring:
    velList = singleRing(new THREE.Vector3(0, 0, 1), 0);
    curves = curveSpray(velList);

    geometry = new THREE.TubeBufferGeometry(curves[0], 5 * params.length, 0.2, 15, false);
    curve0 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve0);

    geometry = new THREE.TubeBufferGeometry(curves[1], 5 * params.length, 0.2, 15, false);
    curve1 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve1);

    geometry = new THREE.TubeBufferGeometry(curves[2], 5 * params.length, 0.2, 15, false);
    curve2 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve2);

    geometry = new THREE.TubeBufferGeometry(curves[3], 5 * params.length, 0.2, 15, false);
    curve3 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve3);

    geometry = new THREE.TubeBufferGeometry(curves[4], 5 * params.length, 0.2, 15, false);
    curve4 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve4);

    geometry = new THREE.TubeBufferGeometry(curves[5], 5 * params.length, 0.2, 15, false);
    curve5 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve5);

    geometry = new THREE.TubeBufferGeometry(curves[6], 5 * params.length, 0.2, 15, false);
    curve6 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve6);

    geometry = new THREE.TubeBufferGeometry(curves[7], 5 * params.length, 0.2, 15, false);
    curve7 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve7);

    geometry = new THREE.TubeBufferGeometry(curves[8], 5 * params.length, 0.2, 15, false);
    curve8 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve8);

    geometry = new THREE.TubeBufferGeometry(curves[9], 5 * params.length, 0.2, 15, false);
    curve9 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve9);

    geometry = new THREE.TubeBufferGeometry(curves[10], 5 * params.length, 0.2, 15, false);
    curve10 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve10);

}





function guiMeshUpdate() { //all the gui updates


}


function meshRotate(theMesh) {


    //updates to the meshes in the scene
    theMesh.rotation.y += params.zRotation / 100 + params.tumble / 100;

    theMesh.rotation.x += params.tumble / 100;
    theMesh.rotation.z += params.tumble / 100;
}





function meshUpdate(currentTime) {

    //
    //    velList = velSpray(new THREE.Vector3(Math.sin(currentTime), 0, Math.cos(currentTime)), 3, 4);
    //    curves = curveSpray(velList);
    //
    //    for (let i = 0; i < curves.length; i++) {
    //        geometry = new THREE.TubeBufferGeometry(curves[i], 5 * params.length, 0.2, 15, false);
    //        curveMesh = new THREE.Mesh(geometry, curveMaterial);
    //        geodesicGroup.add(curveMesh);
    //    }







    velList = singleRing(initialCondition(currentTime), currentTime);
    curves = curveSpray(velList);

    curve0.geometry.dispose();
    curve1.geometry.dispose();
    curve2.geometry.dispose();
    curve3.geometry.dispose();
    curve4.geometry.dispose();
    curve5.geometry.dispose();
    curve6.geometry.dispose();
    curve7.geometry.dispose();
    curve8.geometry.dispose();
    curve9.geometry.dispose();
    curve10.geometry.dispose();


    curve0.geometry = new THREE.TubeBufferGeometry(curves[0], 5 * params.length, 0.2, 15, false);

    curve1.geometry = new THREE.TubeBufferGeometry(curves[1], 5 * params.length, 0.2, 15, false);
    curve2.geometry = new THREE.TubeBufferGeometry(curves[2], 5 * params.length, 0.2, 15, false);
    curve3.geometry = new THREE.TubeBufferGeometry(curves[3], 5 * params.length, 0.2, 15, false);
    curve4.geometry = new THREE.TubeBufferGeometry(curves[4], 5 * params.length, 0.2, 15, false);
    curve5.geometry = new THREE.TubeBufferGeometry(curves[5], 5 * params.length, 0.2, 15, false);

    curve6.geometry = new THREE.TubeBufferGeometry(curves[6], 5 * params.length, 0.2, 15, false);
    curve7.geometry = new THREE.TubeBufferGeometry(curves[7], 5 * params.length, 0.2, 15, false);
    curve8.geometry = new THREE.TubeBufferGeometry(curves[8], 5 * params.length, 0.2, 15, false);
    curve9.geometry = new THREE.TubeBufferGeometry(curves[9], 5 * params.length, 0.2, 15, false);
    curve10.geometry = new THREE.TubeBufferGeometry(curves[10], 5 * params.length, 0.2, 15, false);


}




export {
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
