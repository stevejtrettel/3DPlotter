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







//Make a class for states
//=============================================


class state {
    constructor(pos, vel) {
        this.pos = pos;
        this.vel = vel;
    }
    clone() {
        let p = this.pos.clone();
        let v = this.vel.clone();
        return new state(p, v);
    }
    scaleVel(r) {
        this.vel.multiplyScalar(r);
    }
    normalizeVel(r) {
        this.vel.normalize();
    }
}



class dState {
    constructor(vel, acc) {
        this.vel = vel;
        this.acc = acc;
    }
    rescale(r) {
        this.vel.multiplyScalar(r);
        this.acc.multiplyScalar(r);
    }

    add(state2) {
        this.vel.add(state2.vel);
        this.acc.add(state2.acc);
    }

    clone() {
        let v = this.vel.clone();
        let a = this.acc.clone();
        return new dState(v, a);
    }
}



function nudge(st, dSt, step) {

    let p = st.pos.clone();
    p.add(dSt.vel.clone().multiplyScalar(step));

    let v = st.vel.clone();
    v.add(dSt.acc.clone().multiplyScalar(step));

    return new state(p, v);
}







//DOING RUNGE KUTTA TO THE GEODESIC EQUATIONS
//=============================================



let pos = new THREE.Vector2();
let vel = new THREE.Vector2();
let acc = new THREE.Vector2();
//do one step of numerical integration of the geodesic equations
//state is a pair [pos,vel]


//all the christoffel symbol trash goes in here!
//function acceleration(state) {
//
//
//    return new THREE.Vector2(0, 0);
//}
//






//takes in Vector4[pos,vel] and returns Vector4[vel, acc]
function Deriv(state) {

    let vel = state.vel;
    let acc = acceleration(state);
    let dSt = new dState(vel, acc);

    return dSt;
}

//do Runge Kutta 4
function rk4(state) {

    let step = params.step;

    let step1 = state.clone();
    let k1 = Deriv(step1);
    k1.rescale(step);

    let step2 = nudge(state, k1, 0.5);
    let k2 = Deriv(step2)
    k2.rescale(step);

    let step3 = nudge(state, k2, 0.5);
    let k3 = Deriv(step3)
    k3.rescale(step);

    let step4 = nudge(state, k3, 1.);
    let k4 = Deriv(step4)
    k4.rescale(step);


    //make the final adjustment

    k2.rescale(2);
    k3.rescale(2);

    let adjustment = k1.clone();
    adjustment.add(k2);
    adjustment.add(k3);
    adjustment.add(k4);

    let soltn = nudge(state, adjustment, 1 / 6);

    return soltn;
}









//CREATING A TUBE GEOMETRY FOR GEODESICS
//=============================================

//integrate the geodesic flow
function integrateGeodesic(st, width) {

    let samplePts = [];

    //the initial condition is dSt
    let ui, vi;
    let P;

    let numSteps = params.length / params.step;

    for (let i = 0; i < numSteps; i++) {

        ui = (st.pos).x;
        vi = (st.pos).y;

        P = surface(ui, vi, 0);

        //append points to the list
        samplePts.push(P.multiplyScalar(scalingFactor));

        //move forward one step along the geodesic in UV coordinates
        st = rk4(st);

    }

    return samplePts;

}



function createGeodesic(t, n, widthFactor) {
    points = [];


    let tubeWidth = widthFactor * params.width;
    let samples = 0.15 * params.res * params.length;
    let samplePts;

    //initial tangent vector to geodesic;
    let st = initialCondition(t, n);
    //let st = new state(new THREE.Vector2(0.5, 0.5), new THREE.Vector2(1, 0));

    //this saves to 'points' the tube
    samplePts = integrateGeodesic(st, tubeWidth);

    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(samplePts);

    //set the number of interpolation points here!
    let geodesic = new THREE.TubeBufferGeometry(curve, 10 * params.length, tubeWidth, 15, false);


    //=====if you want balls on the end of the geodesic

    //get the endpoint of the curve:
    let start = samplePts[0];
    let end = samplePts.slice(-1)[0] //endpoint

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
    state,
    dState,
    createParametricSurface,
    createGeodesicSpray
};
