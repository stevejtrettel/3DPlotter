//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import {
    params
} from './ui.js';



let A, B;


let uMin, uMax, uRng, vMin, vMax, vRng;


//=============================================
//FOR THE TORUS
//=============================================
//
//uMin = -3.15;
//uMax = 3.15;
//vMin = -3.15;
//vMax = 3.15;

//function surfaceParamsUpdate() {
//    //update parameters built from a,b,c
//    // A = 2 * params.a + 1.02;
//    A = params.a + 0.1;
//    B = params.b;
//}

//
////X,Y,Z Components of Parameterization
//
//function X(u, v) {
//    return (A + Math.cos(v)) * Math.sin(u);
//}
//
//function Y(u, v) {
//    return (A + Math.cos(v)) * Math.cos(u);
//}
//
//function Z(u, v) {
//    return Math.sin(v);
//}
//
//
////all the christoffel symbol trash goes in here!
//function acceleration(state, t) {
//
//    //unpack the position and velocity coordinates
//    let u = state[0].x;
//    let v = state[0].y;
//    let uP = state[1].x;
//    let vP = state[1].y;
//
//    //For Torus
//    let uAcc = 2 * uP * vP * Math.sin(v) / (A + Math.cos(v));
//    let vAcc = -(A + Math.cos(v)) * uP * uP * Math.sin(v);
//    let acc = new THREE.Vector2(uAcc, vAcc);
//
//    return acc;
//}
//
//
//



////===
////=== === === === === === === === === === === === === ===
////FOR THE GAUSSIAN
////    ===
////    === === === === === === === === === === === === === ===
//uMin = -5;
//uMax = 5;
//vMin = -5;
//vMax = 5;
//
//function surfaceParamsUpdate() {
//    //update parameters built from a,b,c
//    // A = 2 * params.a + 1.02;
//    A = 5 * params.a * params.a;
//    B = 5 * params.b * params.b;
//}
//
//
////X,Y,Z Components of Parameterization
//
//function X(u, v) {
//    return u;
//}
//
//function Y(u, v) {
//    return v
//}
//
//function Z(u, v) {
//    return A * Math.exp(-B * (u * u + v * v));
//}
//
//
////all the christoffel symbol trash goes in here!
//function acceleration(state, t) {
//
//    //unpack the position and velocity coordinates
//    let u = state[0].x;
//    let v = state[0].y;
//    let uP = state[1].x;
//    let vP = state[1].y;
//
//    let num = 4 * A * A * B * B * (uP * uP * (2 * B * u * u - 1) + vP * vP * (2 * B * v * v - 1) + 4 * B * u * v * uP * vP);
//    let denom = 4 * A * A * B * B * (u * u + v * v) + Math.exp(2 * B * (u * u + v * v));
//    let K = num / denom;
//    let acc = new THREE.Vector2(u, v);
//    acc.multiplyScalar(K);
//
//    return acc;
//}
//






////=============================================
////FOR SIN(u)*SIN(v)
////=============================================

uMin = -6.28;
uMax = 6.28;
vMin = -6.28;
vMax = 6.28;

function surfaceParamsUpdate() {
    //update parameters built from a,b,c
    // A = 2 * params.a + 1.02;
    A = 5 * params.a * params.a;
    B = 5 * params.b * params.b;
}
//X,Y,Z Components of Parameterization

function X(u, v) {
    return u;
}

function Y(u, v) {
    return v
}

function Z(u, v) {
    return A * Math.sin(B * u) * Math.sin(B * v);
}


//all the christoffel symbol trash goes in here!
function acceleration(state, t) {

    //unpack the position and velocity coordinates
    let u = state[0].x;
    let v = state[0].y;
    let uP = state[1].x;
    let vP = state[1].y;

    let num = A * A * ((uP * uP + vP * vP) * Math.sin(u) * Math.sin(v) - 2 * uP * vP * Math.cos(u) * Math.cos(v));

    let numU = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * u) * Math.sin(B * v) * Math.sin(B * v) - 2 * Math.cos(B * u) * Math.cos(B * u) * uP * vP * Math.sin(2 * B * v));

    let numV = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * v) * Math.sin(B * u) * Math.sin(B * u) - 2 * Math.cos(B * v) * Math.cos(B * v) * uP * vP * Math.sin(2 * B * u));

    let denom = 2 + A * A * B * B * (1 - Math.cos(2 * B * u) * Math.cos(2 * B * v));

    let acc = new THREE.Vector2(numU, numV);
    acc.divideScalar(denom);
    return acc;
}









//=============================================
//Stuff for all Surfaces
//=============================================


//=====END OF SURFACE DEFINITION
function rescaleU(u) {
    return params.uPercent * (uMax - uMin) * u + uMin;
}

function rescaleV(v) {
    return params.vPercent * (vMax - vMin) * v + vMin;
}


function surface(u, v) {
    return new THREE.Vector3(X(u, v), Z(u, v), -Y(u, v));
}



export {
    A,
    B,
    acceleration,
    surface,
    surfaceParamsUpdate,
    rescaleU,
    rescaleV
}
