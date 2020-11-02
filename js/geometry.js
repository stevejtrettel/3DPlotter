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
    // acceleration,
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



let pos = new THREE.Vector4();
let vel = new THREE.Vector4();
let acc = new THREE.Vector4();
//do one step of numerical integration of the geodesic equations
//state is a pair [pos,vel]


//what is the force field we are subject to?
function acceleration(state) {
    let Rs = 1.;

    //unpack the position and velocity coordinates
    let x = state.pos.x;
    let y = state.pos.y;
    let z = state.pos.z;
    let t = state.pos.w;

    let R = Math.sqrt(x * x + y * y + z * z);

    let xP = state.vel.x;
    let yP = state.vel.y;
    let zP = state.vel.z;
    let tP = state.vel.w;




    //schwarzchild geodesics are the integral curves of the following force, if you project off the time direction:

    //newtonian gravity sun
    let acc = new THREE.Vector4(-x, -y, -z, 0).multiplyScalar(10 * params.a / (R * R * R * R * R));




    //
    //    //newtonian gravity sun
    //    let acc = new THREE.Vector4(-x, -y, -z, 0).multiplyScalar(5 / (R * R * R));
    //

    //constant downwards gravity
    //let acc = new THREE.Vector4(0., 0., -0.1, 0.);

    return acc;
}






//takes in Vector4[pos,vel] and returns Vector4[vel, acc]
function Deriv(state) {

    let vel = state.vel;
    let acc = acceleration(state);
    let dSt = new dState(vel, acc);

    return dSt;
}

//do Runge Kutta 4
function rk4(state, step) {

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

    let adjustment = k1;
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
    let P, p;

    let numSteps = params.length / params.step;
    let step = params.step;

    for (let i = 0; i < numSteps; i++) {

        ui = (st.pos).x;
        vi = (st.pos).y;

        //project away the time coordinate, just draw space:

        P = st.pos;

        //rotate so xyz is normal:
        //p.w is the time component:
        p = new THREE.Vector3(P.x, P.z, -P.y);
        // console.log(p);
        //append points to the list
        samplePts.push(p.clone().multiplyScalar(scalingFactor));

        //if you hit the EH,break :
        //        if (p.length() - 1. < -0.1) {
        //            break;
        //        }
        if (p.length() < 0.8) {
            break;
        }

        //choose step size depending on proximity of P to EH:
        //step = Math.min(0.2, 0.5 * (p.length() - 1.));
        st = rk4(st, step);

    }

    return samplePts;

}



function curveSpray(velList) {

    let curveList = [];
    let geodesic;

    for (let i = 0; i < velList.length; i++) {

        geodesic = integrateGeodesic(velList[i], params.width);
        curveList.push(geodesic);

    }

    return curveList;

}


function createGeodesic(t, n, widthFactor) {


    let tubeWidth = widthFactor * params.width;
    let samples = 0.15 * params.res * params.length;
    let samplePts;

    //initial tangent vector to geodesic;
    let st = initialCondition(t, n);
    console.log(st);
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
    scalingFactor,
    state,
    dState,
    curveSpray,
    createParametricSurface,
    createGeodesicSpray
};
