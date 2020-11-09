//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import { //for merging buffer geometries
    BufferGeometryUtils
} from './libs/BufferGeometryUtils.js';

import {
    params
} from './ui.js';

//import {
//    // acceleration,
//    surfaceParamsUpdate,
//    surface,
//    rescaleU,
//    rescaleV
//} from './surface.js';

import {
    flatSprayCondition
} from './mesh.js';

let points;
let curve;

let scalingFactor = 5;




function sphCoords(phi, theta) {
    let x = Math.cos(theta) * Math.sin(phi);
    let y = Math.sin(theta) * Math.sin(phi);
    let z = Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}



//oblate spheroid coords for Kerr black hole

function boyerLindquist(r, theta, phi, a) {
    let l = Math.sqrt(r * r + a * a);
    let x = l * Math.cos(theta) * Math.sin(phi);
    let y = l * Math.sin(theta) * Math.sin(phi);
    let z = r * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}


//convert bL Coords to Cartesian
function toCartesian(P, a) {
    let r = P.x;
    let theta = P.y;
    let phi = P.z;

    return boyerLindquist(r, theta, phi, a);
}




//parameters that are important for Kerr black hole

function Delta(r, theta, phi, a) {

    return r * r - r + a * a;
}

function Sigma(r, theta, phi, a) {

    return r * r + a * a * Math.cos(phi) * Math.cos(phi);
}






//
////MAKING THE SURFACES IN A KERR BLACK HOLE
////=============================================

function eventHorizon(a, n) {

    return new THREE.ParametricBufferGeometry(
        (u, v, dest) => {
            let R = Math.sqrt(1 - a * a);
            let r;
            if (n < 0) {
                r = 1 - R;
            } else {
                r = 1 + R;
            }
            //rescale based on the size of the parameterization domain
            let theta = 2 * 3.14 * u;
            let phi = 3.14 * v;

            let P = boyerLindquist(r, theta, phi, a);


            dest.set(P.x, P.z, -P.y).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}


function ergoSphere(a, n) {

    return new THREE.ParametricBufferGeometry(
        (u, v, dest) => {

            //rescale based on the size of the parameterization domain
            let theta = 2 * 3.14 * u;
            let phi = 3.14 * v;


            let R = Math.sqrt(1 - a * a * Math.cos(phi) * Math.cos(phi));
            let r;
            if (n < 0) {
                r = 1 - R;
            } else {
                r = 1 + R;
            }

            let P = boyerLindquist(r, theta, phi, a);


            dest.set(P.x, P.z, -P.y).multiplyScalar(scalingFactor);
        },
        params.res, params.res //slices and stacks
    )

}









//INTEGRATING THE GEODESIC EQUATION: CONSTANTS OF MOTION
//===============================================================


//given an initial state, find the constants of motion:

function invariants(state) {

    //coordinate order is r theta phi

    let r = state.pos.x;
    let theta = state.pos.y;
    let phi = state.pos.z;

    let pR = state.vel.x;
    let pTheta = state.vel.y;
    let pPhi = state.vel.z;



    let E = 1;
    let Lz = -pTheta;
    let Q = pPhi * pPhi + Math.cos(phi) * Math.cos(phi) * (params.a * params.a * (-E * E) + (Lz * Lz) / (Math.sin(phi) * Math.sin(phi)));

    return [E, Lz, Q];

}


function TrajectoryParameters(state, invariants) {

    let a = params.a;

    let r = state.x;
    let theta = state.y;
    let phi = state.z;


    let E = invariants[0];
    let Lz = invariants[1];
    let Q = invariants[2];

    let Phi = Q - Math.cos(phi) * Math.cos(phi) * (a * a * (-E * E) + (Lz * Lz) / (Math.sin(phi) * Math.sin(phi)));


    let P = E * (r * r + a * a) - a * Lz;

    let Del = Delta(r, theta, phi, a);


    let R = P * P - Del * ((Lz - a * E) * (Lz - a * E) + Q);


    return [Phi, P, R];

}



function velocity(state, invariants) {

    let a = params.a;

    let r = state.x;
    let theta = state.y;
    let phi = state.z;

    let E = invariants[0];
    let Lz = invariants[1];
    let Q = invariants[2];

    let T = TrajectoryParameters(state, invariants);

    let Phi = T[0];
    let P = T[1];
    let R = T[2];

    let Sig = Sigma(r, theta, phi, a);
    let Del = Delta(r, theta, phi, a);

    let dr = Math.sqrt(Math.abs(R)) / Sig;

    let dTheta = -(a * E - Lz / (Math.sin(phi) * Math.sin(phi))) + a / Del * P;

    let dPhi = Math.sqrt(Math.abs(Phi)) / Sig;

    return new THREE.Vector3(dr, dTheta, dPhi);


}



function nudgePos(pos, vel, step) {
    let p = pos.clone();
    p.add(vel.clone().multiplyScalar(step));

    return p;
}


//do Runge Kutta 4 for velocity
function numIntegrate(pos, invariants, step) {


    let step1 = pos.clone();
    let k1 = velocity(step1, invariants);
    k1.multiplyScalar(step);

    let step2 = nudgePos(pos, k1, 0.5);
    let k2 = velocity(step2, invariants);
    k2.multiplyScalar(step);

    let step3 = nudgePos(pos, k2, 0.5);
    let k3 = velocity(step3, invariants);
    k3.multiplyScalar(step);

    let step4 = nudgePos(pos, k3, 1.);
    let k4 = velocity(step4, invariants);
    k4.multiplyScalar(step);


    //make the final adjustment

    k2.multiplyScalar(2);
    k3.multiplyScalar(2);

    let adjustment = k1;
    adjustment.add(k2);
    adjustment.add(k3);
    adjustment.add(k4);

    let soltn = nudgePos(pos, adjustment, 1 / 6);

    return soltn;
}




//CREATING A TUBE GEOMETRY FOR GEODESICS
//=============================================

//integrate the geodesic flow
function integrateKerrGeodesic(st) {

    let samplePts = [];


    //set the invariants
    let inv = invariants(st);

    //the initial condition is dSt
    // let ui, vi;
    let P, p, q, r;
    let a = params.a;

    P = st.pos;
    let stopRad = 2.;

    let numSteps = params.length / params.step;
    let step = params.step;

    for (let i = 0; i < numSteps; i++) {

        p = toCartesian(P, a);
        q = new THREE.Vector3(p.x, p.z, -p.y);

        samplePts.push(q.clone().multiplyScalar(scalingFactor));


        //if you are simulating relativistic physics and you enter the event horizon, stop: if classical - stop when you get inside of some small distance:

        if (Math.abs(P.x) < 0.8 * stopRad) {
            break;
        }


        P = numIntegrate(P, inv, step);

    }

    return samplePts;

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



//======right now not being used==========
//======the direct geodesic equations in 4 space =======

function acceleration4D(state) {
    let Rs = 1.;

    //unpack the position and velocity coordinates
    let x = state.pos.x;
    let y = state.pos.y;
    let z = state.pos.z;
    let t = state.pos.w;

    let xP = state.vel.x;
    let yP = state.vel.y;
    let zP = state.vel.z;
    let tP = state.vel.w;


    let rho2 = x * x + y * y + z * z;
    let rho = Math.sqrt(rho2);

    //the time derivative
    let tAcc = 4 * Rs * tP * (x * xP + y * yP * z * zP) /
        (rho * (rho2 - Rs * Rs));

    //the space derivatives
    let C1 = 2 * Rs / (Rs + rho);
    let C2 = (Rs - rho) / (Math.pow(Rs + rho, 6)) * rho2 * rho * tP * tP;
    let C3 = 1 / rho2;

    let xa = xP * xP + 2 * xP * (yP * yP + zP * zP) - x * (yP * yP + zP * zP);
    let xAcc = C1 * (C2 * x + C3 * xa);

    let ya = yP * yP + 2 * yP * (xP * xP + zP * zP) - y * (xP * xP + zP * zP);
    let yAcc = C1 * (C2 * y + C3 * ya);

    let za = zP * zP + 2 * zP * (xP * xP + yP * yP) - z * (xP * xP + yP * yP);
    let zAcc = C1 * (C2 * z + C3 * za);

    let acc = new THREE.Vector4(xAcc, yAcc, zAcc, tAcc);

    return acc;
}









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

    let acc;


    //schwarzchild geodesics are the integral curves of the following force, if you project off the time direction:

    //the force law to get the geodesic actually depends on the angular momentum! Which is computed from the state:
    let ang = state.pos.clone().cross(state.vel);
    let L = ang.length();
    let magnitude = 1.5 * L * L / (R * R * R * R * R);
    acc = new THREE.Vector4(-x, -y, -z, 0).multiplyScalar(magnitude);


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
function integrateGeodesic(st) {

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


        //if you are simulating relativistic physics and you enter the event horizon, stop: if classical - stop when you get inside of some small distance:
        let stopRad = 1.;
        if (params.physics == 0) {
            stopRad = 0.2
        }

        if (p.length() < 0.8 * stopRad) {
            break;
        }


        //choose step size depending on proximity of P to EH:
        //step = Math.min(0.2, 0.5 * (p.length() - 1.));
        st = rk4(st, step);

    }

    return samplePts;

}


//give the output as a curve
function geodesicPath(st) {
    let samplePts = integrateKerrGeodesic(st);
    return new THREE.CatmullRomCurve3(samplePts);
}



function sprayPath(velList) {

    let curveList = [];
    let geodesic;

    for (let i = 0; i < velList.length; i++) {

        geodesic = geodesicPath(velList[i]);
        curveList.push(geodesic);

    }

    return curveList;

}









function geodesicGeometry(t, n, widthFactor) {


    let tubeWidth = widthFactor * params.width;
    let samples = 0.15 * params.res * params.length;
    let samplePts;

    //initial tangent vector to geodesic;
    let st = flatSprayCondition(t, n);
    console.log(st);
    //let st = new state(new THREE.Vector2(0.5, 0.5), new THREE.Vector2(1, 0));

    //this saves to 'points' the tube
    samplePts = integrateGeodesic(st);

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

    let ray = geodesicGeometry(t, 0, 1);

    if (spraySize > 1) {

        let geodesics = [];

        //add the middle geodesic:
        geodesics.push(ray);


        let widthFactor;

        for (let i = 1; i < spraySize; i++) {

            widthFactor = 1 / (1 + i);

            ray = geodesicGeometry(t, i, widthFactor);
            geodesics.push(ray);

            ray = geodesicGeometry(t, -i, widthFactor);
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
    sphCoords,
    boyerLindquist,
    eventHorizon,
    ergoSphere,
    scalingFactor,
    state,
    dState,
    sprayPath,
    createGeodesicSpray
};
