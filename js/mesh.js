////Import Stuff, Variables
////=============================================
import * as THREE from './libs/three.module.js';

import {
    params
} from './ui.js';


import {
    scene
} from './scene.js';

//
//import {
////    // acceleration,
////    surfaceParamsUpdate,
////    // surface,
////    rescaleU,
////    rescaleV,
////    equationUpdate
//} from './surface.js';


import {
    sphCoords,
    scalingFactor,
    state,
    // dState,
    sprayPath,
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
let curve;
let curveMesh;


//let startBall, endBall;
//let startBallMesh, endBallMesh;



let velList;
let curves;
let geodesicGroup;


let curve0, curve1, curve2, curve3, curve4, curve5;
let curve6, curve7, curve8, curve9, curve10;




//gives the initial condition as a function of time
//n is the number of curve we are on
function flatSprayCondition(s, n) {

    let wiggle = params.wiggle / 10;
    //==== INITIAL POSITION

    //start from center
    let pos = new THREE.Vector4(3., 3., 0., 0.).multiplyScalar(4. * params.p);

    //start from a corner
    //let pos = new THREE.Vector2(uMin + uRng / 8, vMin + uRng / 8);


    //===== SPACING
    let spacing = 3.14 / 90;

    //rotate back and forth
    //let theta = 3.14 / 8. * (Math.sin(t / 3) + 1) + 3.14 / 8 + n * 3.14 / 90;

    //rotate in a circle
    //let theta = t / 5 + n * spacing;

    //control angle with slider
    let theta = params.angle + n * spacing + Math.cos(s) * wiggle;

    //assemble the velocity vector
    let vel = new THREE.Vector4(Math.cos(theta), Math.sin(theta), 0, 1.);

    return new state(pos, vel);

}





function initialCondition(t) {

    let pos = new THREE.Vector3(3., 1., 1.);

    let wiggle = params.wiggle;

    let phi = params.angle + 0.4 * wiggle * Math.cos(2 * t);
    let theta = params.theta + wiggle * Math.sin(t);

    let vel = sphCoords(phi, theta);

    return new state(pos, vel);
}






function singleRing(iniState, t) {
    let st; //state;

    let v = iniState.vel;

    let pos = iniState.pos;


    let velList = [];

    //add the central vector
    st = new state(pos, v);
    velList.push(st);


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

        st = new state(pos, u);
        velList.push(st);

        st = new state(pos, U);
        velList.push(st);
    }


    return velList;

}



//
////Textured Surface
////=============================================
//// create a texture loader.
//const textureLoader = new THREE.TextureLoader();
//
//// Load a texture. See the note in chapter 4 on working locally, or the page
//const texture = textureLoader.load('./textures/Grid.png');
//
//// set the "color space" of the texture
//texture.encoding = THREE.sRGBEncoding;
//// reduce blurring at glancing angles
//texture.anisotropy = 16;
//
//
////boolean to decide if we draw the texture
//let drawTex = params.drawTex;
//
//
////determine if we add a picture texture based on 
//function addTexture(value) {
//    if (value == 1) {
//        return texture;
//    } else {
//        return null;
//    }
//}
//



//Meshes
//=============================================

function createMeshes(cubeTexture) {
    //set the parameters
    //  surfaceParamsUpdate();
    // equationUpdate();
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


    //CREATE THE GEOMETRIES

    //  parametric surface geometry
    geometry = new THREE.SphereBufferGeometry(scalingFactor, 32, 32);

    parametricMesh = new THREE.Mesh(geometry, colorMaterial);
    parametricMesh.position.set(0, 0, 0);
    scene.add(parametricMesh);




    //===============================================
    // flat geodesic spray 
    //================================================
    geometry = createGeodesicSpray(0, 10. * params.spray);
    curveMesh = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curveMesh);





    //===============================================
    // 3d spray
    //================================================


    //instead of a giant spray, just a single ring:
    let iniState = new state(new THREE.Vector3(3, 1, 1), new THREE.Vector3(0, 0, 1));
    velList = singleRing(iniState, 0);
    console.log(velList[0]);

    curves = sprayPath(velList);
    console.log(curves[0]);

    geometry = new THREE.TubeBufferGeometry(curves[0], 5 * params.length, 0.2, 15, false);
    curve0 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve0);

    geometry = new THREE.TubeBufferGeometry(curves[1], 5 * params.length, 0.15, 15, false);
    curve1 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve1);

    geometry = new THREE.TubeBufferGeometry(curves[2], 5 * params.length, 0.1, 15, false);
    curve2 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve2);

    geometry = new THREE.TubeBufferGeometry(curves[3], 5 * params.length, 0.15, 15, false);
    curve3 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve3);

    geometry = new THREE.TubeBufferGeometry(curves[4], 5 * params.length, 0.1, 15, false);
    curve4 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve4);

    geometry = new THREE.TubeBufferGeometry(curves[5], 5 * params.length, 0.15, 15, false);
    curve5 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve5);

    geometry = new THREE.TubeBufferGeometry(curves[6], 5 * params.length, 0.1, 15, false);
    curve6 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve6);

    geometry = new THREE.TubeBufferGeometry(curves[7], 5 * params.length, 0.15, 15, false);
    curve7 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve7);

    geometry = new THREE.TubeBufferGeometry(curves[8], 5 * params.length, 0.1, 15, false);
    curve8 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve8);

    geometry = new THREE.TubeBufferGeometry(curves[9], 5 * params.length, 0.15, 15, false);
    curve9 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve9);

    geometry = new THREE.TubeBufferGeometry(curves[10], 5 * params.length, 0.1, 15, false);
    curve10 = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curve10);





}





function guiMeshUpdate() { //all the gui updates


    //surfaceParamsUpdate();

    //
    //update the mesh graphics parameters;
    //    parametricMesh.material.metalness = params.metal;
    //    parametricMesh.material.roughness = params.rough / 4.;
    //    parametricMesh.material.color.set(params.color);
    //








    //
    //    //===============================================
    //    // flat geodesic spray 
    //    //================================================
    //    curveMesh.material.color.set(params.curveColor);
    //    curveMesh.material.metalness = params.metal;
    //    curveMesh.material.roughness = params.rough / 4.;

    //drawTex = params.drawTex;

    //decide based on the boolean drawTex
    //    if (params.drawTex == 1) {
    //        parametricMesh.material = texMaterial;
    //    } else {
    //        parametricMesh.material = colorMaterial;
    //    }



}


function meshRotate(theMesh) {


    //updates to the meshes in the scene
    theMesh.rotation.y += params.zRotation / 100 + params.tumble / 100;

    theMesh.rotation.x += params.tumble / 100;
    theMesh.rotation.z += params.tumble / 100;
}





function meshUpdate(currentTime) {


    // wiggle the parametric mesh
    //    parametricMesh.geometry.dispose();
    //    parametricMesh.geometry = createParametricSurface(currentTime);
    //meshRotate(parametricMesh);




    //===============================================
    // flat geodesic spray 
    //================================================

    //    meshRotate(curveMesh);
    // wiggle the curve mesh
    curveMesh.geometry.dispose();
    curveMesh.geometry = createGeodesicSpray(currentTime, 10. * params.spray);
    //








    //===============================================
    // 3d spray
    //================================================


    velList = singleRing(initialCondition(currentTime), currentTime);
    curves = sprayPath(velList);

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

    curve1.geometry = new THREE.TubeBufferGeometry(curves[1], 5 * params.length, 0.15, 15, false);
    curve2.geometry = new THREE.TubeBufferGeometry(curves[2], 5 * params.length, 0.1, 15, false);
    curve3.geometry = new THREE.TubeBufferGeometry(curves[3], 5 * params.length, 0.15, 15, false);
    curve4.geometry = new THREE.TubeBufferGeometry(curves[4], 5 * params.length, 0.1, 15, false);
    curve5.geometry = new THREE.TubeBufferGeometry(curves[5], 5 * params.length, 0.15, 15, false);

    curve6.geometry = new THREE.TubeBufferGeometry(curves[6], 5 * params.length, 0.1, 15, false);
    curve7.geometry = new THREE.TubeBufferGeometry(curves[7], 5 * params.length, 0.15, 15, false);
    curve8.geometry = new THREE.TubeBufferGeometry(curves[8], 5 * params.length, 0.1, 15, false);
    curve9.geometry = new THREE.TubeBufferGeometry(curves[9], 5 * params.length, 0.15, 15, false);
    curve10.geometry = new THREE.TubeBufferGeometry(curves[10], 5 * params.length, 0.1, 15, false);



}




export {
    flatSprayCondition,
    initialCondition,
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
