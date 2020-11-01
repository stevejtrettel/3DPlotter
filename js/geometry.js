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
    acceleration,
    surfaceParamsUpdate,
    surface,
    rescaleU,
    rescaleV
} from './surface.js';

import {
    initialCondition
} from './mesh.js';

let points;
let curve;

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









//DOING RUNGE KUTTA TO THE GEODESIC EQUATIONS
//=============================================



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









//CREATING A TUBE GEOMETRY FOR GEODESICS
//=============================================





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

        let Pi = surface(ui, vi, t);

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




//====end of geodesic stuff


export {
    createParametricSurface,
    createGeodesicSpray
};
