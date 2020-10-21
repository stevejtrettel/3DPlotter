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
    A,
    B,
    acceleration,
    surfaceParamsUpdate,
    surface,
    rescaleU,
    rescaleV
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

            let P = surface(U, V);


            dest.set(P.x, P.y, P.z).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}







let pos = new THREE.Vector2();
let vel = new THREE.Vector2();
let acc = new THREE.Vector2();
//do one step of numerical integration of the geodesic equations
//state is a pair [pos,vel]



//takes in Vector4[pos,vel] and returns Vector4[vel, acc]
function stateDeriv(st4, t) {

    let pos = new THREE.Vector2(st4.x, st4.y);
    let vel = new THREE.Vector2(st4.z, st4.w);

    let acc = acceleration([pos, vel], t);

    return new THREE.Vector4(vel.x, vel.y, acc.x, acc.y);
}




//do Runge Kutta 4
function geodesicOneStep(state, t) {

    let step = params.step;
    //unpack the position and velocity
    pos = state[0];
    vel = state[1];

    let st4 = new THREE.Vector4(pos.x, pos.y, vel.x, vel.y);

    let k1 = stateDeriv(st4, t + 0.5 * step).multiplyScalar(step);

    let k2 = stateDeriv(st4.clone().add(k1.clone().multiplyScalar(0.5)), t + 0.5 * step).multiplyScalar(step);

    let k3 = stateDeriv(st4.clone().add(k2.clone().multiplyScalar(0.5)), t + 0.5 * step).multiplyScalar(step);

    let k4 = stateDeriv(st4.clone().add(k3), t + 0.5 * step).multiplyScalar(step);

    let adjustment = k1.clone().add(k2.clone().multiplyScalar(2));
    adjustment.add(k3.clone().multiplyScalar(2));
    adjustment.add(k4);

    let soltn = st4.clone().add(adjustment.multiplyScalar(1 / 6));

    //now need to break the solution down into the right type of object to return; a state
    pos = new THREE.Vector2(soltn.x, soltn.y);
    vel = new THREE.Vector2(soltn.z, soltn.w);
    return [pos, vel];
}






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

    return [pos, vel];
}




function createGeodesic(t, n, widthFactor) {
    points = [];


    let tubeWidth = widthFactor * params.width;
    let samples = 0.15 * params.res * params.length;


    let ui, vi;

    //initial tangent vector to geodesic;
    let state = initialCondition(t, n);

    let numSteps = params.length / params.step;

    for (let i = 0; i < numSteps; i++) {

        ui = (state[0]).x;
        vi = (state[0]).y;

        let Pi = surface(ui, vi);

        //append points to the list
        points.push(Pi.multiplyScalar(scalingFactor));

        //move forward one step along the geodesic in UV coordinates
        state = geodesicOneStep(state, t);

    }


    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    //set the number of interpolation points here!
    let geodesic = new THREE.TubeBufferGeometry(curve, 10 * params.length, tubeWidth, 15, false);



    // return geodesic;




    //=====if you want balls on the end of the geodesic
    //slows it down slightly right now

    //get the endpoint of the curve:
    let start = points[0];
    let end = points.slice(-1)[0] //endpoint

    let ball = new THREE.SphereBufferGeometry(2. * tubeWidth, 15, 15);


    let endBall = ball.clone().translate(end.x, end.y, end.z);
    let startBall = ball.clone().translate(start.x, start.y, start.z);

    let merged = BufferGeometryUtils.mergeBufferGeometries([geodesic, startBall, endBall]);

    return merged;
}


//====end of geodesic stuff





function createGeodesicSpray(t, spraySize) {

    let ray = createGeodesic(t, 0, 1);

    if (spraySize > 1) {

        let geodesics = [];

        //add the middle geodesic:
        geodesics.push(ray);


        let widthFactor;

        for (let i = 1; i < spraySize; i++) {

            widthFactor = 1 / (1 + i);

            ray = createGeodesic(t, i, widthFactor);
            geodesics.push(ray);

            ray = createGeodesic(t, -i, widthFactor);
            geodesics.push(ray);
        }


        let merged = BufferGeometryUtils.mergeBufferGeometries(geodesics);

        return merged;
    }

    //if not then just the one geodesic;
    return ray;

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


    //
    //
    //    //put a sphere at the start of the geodesic
    //    geometry = new THREE.SphereGeometry(2 * params.width, 32, 32);
    //    startBallMesh = new THREE.Mesh(geometry, curveMaterial);
    //    //get the initial condition from the curves to place it
    //    let pos = points[0];
    //    startBallMesh.position.set(pos.x, pos.y, pos.z);
    //    scene.add(startBallMesh);
    //
    //
    //
    //    //    //put a sphere at the END of the geodesic
    //    geometry = new THREE.SphereGeometry(1.25 * params.width, 32, 32);
    //    endBallMesh = new THREE.Mesh(geometry, curveMaterial);
    //    //get the initial condition from the curves to place it
    //    pos = points.slice(-1)[0];
    //    endBallMesh.position.set(pos.x, pos.y, pos.z);
    //    scene.add(endBallMesh);

}





function guiMeshUpdate() { //all the gui updates


    surfaceParamsUpdate();

    //
    //update the mesh graphics parameters;
    parametricMesh.material.metalness = params.metal;
    parametricMesh.material.roughness = params.rough / 4.;

    curveMesh.material.color.set(params.color);
    curveMesh.material.metalness = params.metal;
    curveMesh.material.roughness = params.rough / 4.;

    drawTex = params.drawTex;


}


function meshRotate(theMesh) {


    //updates to the meshes in the scene
    theMesh.rotation.y += params.zRotation / 100 + params.tumble / 100;

    theMesh.rotation.x += params.tumble / 100;
    theMesh.rotation.z += params.tumble / 100;
}





function meshUpdate(currentTime) {


    //updates to the meshes in the scene
    meshRotate(parametricMesh);
    meshRotate(curveMesh);


    // wiggle the parametric mesh
    parametricMesh.geometry.dispose();
    parametricMesh.geometry = createParametricSurface(currentTime);

    //decide based on the boolean drawTex
    if (drawTex == 1) {
        parametricMesh.material = texMaterial;
    } else {
        parametricMesh.material = colorMaterial;
    }


    // wiggle the curve mesh
    curveMesh.geometry.dispose();
    curveMesh.geometry = createGeodesicSpray(currentTime, params.spray);



}




export {
    createMeshes,
    guiMeshUpdate,
    meshUpdate
}
