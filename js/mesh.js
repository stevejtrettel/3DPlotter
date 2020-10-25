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


//import {
//    A,
//    B,
//    acceleration,
//    surfaceParamsUpdate,
//    surface,
//    rescaleU,
//    rescaleV
//} from './surface.js';

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


let startBall, endBall;
let startBallMesh, endBallMesh;

let scalingFactor = 5;

let velList;
let curves;




//gives the initial condition as a function of time
//special for geodesics at the origin
//n is the number of curve we are on
function initialCondition(t, n) {

    let wiggle = params.wiggle;

    let phi = 0.2;
    let theta = wiggle;

    return [phi, theta];
}





function nilFlow(v, s) {

    //v is a unit tangent vector


    //this is the geodesic from the origin
    let a = Math.sqrt(v.x * v.x + v.y * v.y);
    let c = v.z;
    let theta = Math.atan2(v.y, v.x);

    let x, y, z;

    if (c == 0) {
        x = t * Math.cos(theta);
        y = t * Math.sin(theta);
        z = 0;
    } else { //geodesic flow
        x = 2. * a / c * Math.sin(c * s / 2) * Math.cos(c * s / 2 + theta);
        y = 2. * a / c * Math.sin(c * s / 2) * Math.sin(c * s / 2 + theta);
        z = c * s + a * a / (2 * c * c) * (c * s - Math.sin(c * s));
    }
    return new THREE.Vector3(x, y, -z);
}





function createGeodesic(v, t, widthFactor) {

    //    let phi = Math.acos(v.z);
    //    let theta = Math.atan2(v.y, v.x);


    points = [];


    let tubeWidth = widthFactor * params.width;
    let samples = 2. * params.length;


    //initial tangent vector to geodesic;
    // let state = initialCondition(t, n);


    //only one step for every unit length
    let numSteps = params.length;

    for (let i = 0; i < numSteps; i++) {

        let P = nilGeodesicPoint(v, i * 1);

        //append points to the list
        points.push(P.multiplyScalar(scalingFactor));

    }


    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    //set the number of interpolation points here!
    let geodesic = new THREE.TubeBufferGeometry(curve, 10 * params.length, tubeWidth, 15, false);



    return geodesic;



    //
    //    //=====if you want balls on the end of the geodesic
    //    //slows it down slightly right now
    //
    //    //get the endpoint of the curve:
    //    let start = points[0];
    //    let end = points.slice(-1)[0] //endpoint
    //
    //    let ball = new THREE.SphereBufferGeometry(2. * tubeWidth, 15, 15);
    //
    //
    //    let endBall = ball.clone().translate(end.x, end.y, end.z);
    //    let startBall = ball.clone().translate(start.x, start.y, start.z);
    //
    //    let merged = BufferGeometryUtils.mergeBufferGeometries([geodesic, startBall, endBall]);
    //
    //    return merged;
}




//take in a vector, spit out the curve 
function nilGeodesic(v) {

    points = [];


    let tubeWidth = params.width;
    //samples per unit length
    let samples = 2.;


    for (let i = 0; i < samples * params.length; i++) {

        let P = nilFlow(v, i / samples);

        //append points to the list
        points.push(P.multiplyScalar(scalingFactor));
    }

    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    return curve

}



//====end of geodesic stuff

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



function curveSpray(velList) {

    let curveList = [];
    let geodesic;

    for (let i = 0; i < velList.length; i++) {

        geodesic = nilGeodesic(velList[i]);
        curveList.push(geodesic);

    }

    return curveList;

}



function sphCoords(phi, theta) {
    let x = Math.cos(theta) * Math.sin(phi);
    let y = Math.sin(theta) * Math.sin(phi);
    let z = Math.cos(phi);
    return new THREE.Vector3(x, y, z);
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



    geometry = new THREE.SphereBufferGeometry(3, 32, 32);
    parametricMesh = new THREE.Mesh(geometry, colorMaterial);
    scene.add(parametricMesh);



    //    let path = new createNilCurve(1, 1, 0);
    //    geometry = new THREE.TubeBufferGeometry(path, 10 * params.length, params.width, 15, false);
    //
    //    parametricMesh = new THREE.Mesh(geometry, texMaterial);
    //    scene.add(parametricMesh);

    //make curve based on u,v coordinates;
    //geometry = createGeodesic(0, 0);


    //
    //    geometry = createGeodesicSpray(0, params.spray);
    //
    //
    //    curveMesh = new THREE.Mesh(geometry, curveMaterial);
    //    scene.add(curveMesh);
    velList = velSpray(new THREE.Vector3(0, 0, 1), 10, 5);
    curves = curveSpray(velList);

    for (let i = 0; i < curves.length; i++) {
        geometry = new THREE.TubeBufferGeometry(curves[i], 5 * params.length, 0.2, 15, false);
        curveMesh = new THREE.Mesh(geometry, curveMaterial);
        scene.add(curveMesh);
    }

    //    //    
    //    let geodesics = createGeodesicSpray(0, params.spray);
    //    for (let i = 0; i < geodesics.length; i++) {
    //
    //        curveMesh = new THREE.Mesh(geodesics[i], curveMaterial);
    //        scene.add(curveMesh);
    //    }


}





function guiMeshUpdate() { //all the gui updates


    //surfaceParamsUpdate();


    //
    //update the mesh graphics parameters;
    //parametricMesh.material.metalness = params.metal;
    //parametricMesh.material.roughness = params.rough / 4.;

    //    curveMesh.material.color.set(params.color);
    //    curveMesh.material.metalness = params.metal;
    //    curveMesh.material.roughness = params.rough / 4.;
    //
    //    drawTex = params.drawTex;


}


function meshRotate(theMesh) {


    //updates to the meshes in the scene
    theMesh.rotation.y += params.zRotation / 100 + params.tumble / 100;

    theMesh.rotation.x += params.tumble / 100;
    theMesh.rotation.z += params.tumble / 100;
}





function meshUpdate(currentTime) {


    //updates to the meshes in the scene
    //meshRotate(parametricMesh);
    // meshRotate(curveMesh);

    //
    //    // wiggle the parametric mesh
    //    parametricMesh.geometry.dispose();
    //    parametricMesh.geometry = createParametricSurface(currentTime);
    //
    //    //decide based on the boolean drawTex
    //    if (drawTex == 1) {
    //        parametricMesh.material = texMaterial;
    //    } else {
    //        parametricMesh.material = colorMaterial;
    //    }


    // wiggle the curve mesh
    //
    //        velList = velSpray(new THREE.Vector3(0, 0, 1), 5, 3);
    //    curves = curveSpray(velList);
    //
    //    for (let i = 0; i < curves.length; i++) {
    //        geometry = new THREE.TubeBufferGeometry(curves[i], 5 * params.length, 0.2, 15, false);
    //        curveMesh = new THREE.Mesh(geometry, curveMaterial);
    //        scene.add(curveMesh);
    //    }
    //    

    //
    //    let geodesics = createGeodesicSpray(0, params.spray);
    //    for (let i = 0; i < geodesics.length; i++) {
    //
    //        curveMesh = new THREE.Mesh(geodesics[i], curveMaterial);
    //        scene.add(curveMesh);
    //    }


    //    //    curveMesh.geometry.dispose();
    //    curveMesh.geometry = createGeodesicSpray(currentTime, params.spray);


}




export {
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
