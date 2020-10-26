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
    surfaceParamsUpdate,
    surface,
    planeCurve,
    surfaceSheet,
    surfaceCurve,
    plane,
    rescaleU,
    rescaleV,
    rescaleS,
    equationUpdate
} from './surface.js';

let meshes;






//internal variables
let geometry;
let material;
let texMaterial;
let colorMaterial;
let curveMaterial;
let parametricMesh;

let points;
let curve;
let curveMesh;
let surfaceCurveMesh;

let planeMesh;
let planeMaterial;

let sheetMaterial;
let sheetMesh;

let startBall, endBall;
let startBallMesh, endBallMesh;

let scalingFactor = 5;



//MAKING A PARAMETRIC SURFACE FUNCTIONS
//=============================================


function createParametricSurface(t) {

    return new THREE.ParametricBufferGeometry(
        (u, v, dest) => {

            //rescale based on the size of the parameterization domain
            let U = rescaleU(u);
            let V = rescaleV(v);

            let P = surface(U, V, t);


            dest.set(P.x, P.y, P.z).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}



function createParametricPlane(t) {

    return new THREE.ParametricBufferGeometry(
        (u, v, dest) => {

            //rescale based on the size of the parameterization domain
            let U = rescaleU(u);
            let V = rescaleV(v);

            let P = plane(U, V, t);


            dest.set(P.x, P.y, P.z).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}


function createSurfaceSheet(t) {

    return new THREE.ParametricBufferGeometry(
        (w, s, dest) => {

            //rescale based on the size of the parameterization domain
            let S = rescaleS(s);


            let P = surfaceSheet(w, S, t);


            dest.set(P.x, P.y, P.z).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}

//take in a vector, spit out the curve 
function planeCurvePath(t) {

    points = [];


    let tubeWidth = params.width;

    let samples = 50.;


    for (let i = 0; i < samples; i++) {


        let P = planeCurve(rescaleS(i / samples), t);
        P.multiplyScalar(scalingFactor);
        //append points to the list
        points.push(P);

    }

    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    return curve

}



//take in a vector, spit out the curve 
function surfaceCurvePath(t) {

    points = [];


    let tubeWidth = params.width;
    //samples per unit length
    let samples = 50.;


    for (let i = 0; i < samples; i++) {

        let P = surfaceCurve(rescaleS(i / samples), t);
        P.multiplyScalar(scalingFactor);
        //append points to the list
        points.push(P);

    }

    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    return curve

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


    planeMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: params.metal,
        roughness: params.rough,
        envMap: cubeTexture,
        envMapIntensity: 1.,
        side: THREE.DoubleSide,
    });



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
        transparent: true,
        opacity: params.opacity,
        envMap: cubeTexture,
        envMapIntensity: 1.,
        side: THREE.DoubleSide,
    });


    sheetMaterial = new THREE.MeshStandardMaterial({
        color: 0x994AC7,
        metalness: params.metal,
        roughness: params.rough,
        //        transparent: true,
        //        opacity: 0.75,
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


    geometry = createParametricPlane(0);
    planeMesh = new THREE.Mesh(geometry, planeMaterial);
    planeMesh.position.set(0, 0, 0);
    scene.add(planeMesh);


    curve = planeCurvePath(0);
    geometry = new THREE.TubeBufferGeometry(curve, 100, params.width, 15, false);
    curveMesh = new THREE.Mesh(geometry, curveMaterial);
    scene.add(curveMesh);


    curve = surfaceCurvePath(0);
    geometry = new THREE.TubeBufferGeometry(curve, 100, params.width, 15, false);
    surfaceCurveMesh = new THREE.Mesh(geometry, curveMaterial);
    scene.add(surfaceCurveMesh);



    geometry = createSurfaceSheet(0);
    sheetMesh = new THREE.Mesh(geometry, sheetMaterial);
    sheetMesh.position.set(0, 0, 0);
    scene.add(sheetMesh);

}





function guiMeshUpdate() { //all the gui updates


    surfaceParamsUpdate();
    colorMaterial.opacity = params.opacity;
    //
    //update the mesh graphics parameters;
    parametricMesh.material.metalness = params.metal;
    parametricMesh.material.roughness = params.rough / 4.;
    parametricMesh.material.color.set(params.color);


    drawTex = params.drawTex;


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
    meshRotate(sheetMesh);
    meshRotate(planeMesh);
    meshRotate(curveMesh);
    meshRotate(surfaceCurveMesh);


    // wiggle the parametric mesh
    parametricMesh.geometry.dispose();
    parametricMesh.geometry = createParametricSurface(currentTime);


    // wiggle the parametric mesh
    curveMesh.geometry.dispose();
    curve = planeCurvePath(currentTime);
    geometry = new THREE.TubeBufferGeometry(curve, 100, params.width, 15, false);
    curveMesh.geometry = geometry;


    // wiggle the parametric mesh
    surfaceCurveMesh.geometry.dispose();
    curve = surfaceCurvePath(currentTime);
    geometry = new THREE.TubeBufferGeometry(curve, 100, params.width, 15, false);
    surfaceCurveMesh.geometry = geometry;



    // wiggle the parametric mesh
    sheetMesh.geometry.dispose();
    sheetMesh.geometry = createSurfaceSheet(currentTime);



    //decide based on the boolean drawTex
    if (drawTex == 1) {
        parametricMesh.material = texMaterial;
    } else {
        parametricMesh.material = colorMaterial;
    }



}




export {
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
