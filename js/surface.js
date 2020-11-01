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
//
//function surfaceParamsUpdate() {
//    //update parameters built from a,b,c
//    A = 2 * params.a + 1.02;
//    B = params.b;
//}
//
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



////===
////=== === === === === === === === === === === === === ===
////FOR THE GAUSSIAN
////    ===
////    === === === === === === === === === === === === === ===
uMin = -5;
uMax = 5;
vMin = -5;
vMax = 5;

function surfaceParamsUpdate() {
    //update parameters built from a,b,c
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
    return A * Math.exp(-B * (u * u + v * v));
}


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


//////=============================================
//////FOR SIN(u)*SIN(v)
//////=============================================
//
//uMin = -6.28;
//uMax = 6.28;
//vMin = -6.28;
//vMax = 6.28;

//function surfaceParamsUpdate() {
//    //update parameters built from a,b,c
//    // A = 2 * params.a + 1.02;
//    A = 5 * params.a * params.a;
//    B = 5 * params.b * params.b;
//}
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
//    return A * Math.sin(B * u) * Math.sin(B * v);
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
//    let num = A * A * ((uP * uP + vP * vP) * Math.sin(u) * Math.sin(v) - 2 * uP * vP * Math.cos(u) * Math.cos(v));
//
//    let numU = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * u) * Math.sin(B * v) * Math.sin(B * v) - 2 * Math.cos(B * u) * Math.cos(B * u) * uP * vP * Math.sin(2 * B * v));
//
//    let numV = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * v) * Math.sin(B * u) * Math.sin(B * u) - 2 * Math.cos(B * v) * Math.cos(B * v) * uP * vP * Math.sin(2 * B * u));
//
//    let denom = 2 + A * A * B * B * (1 - Math.cos(2 * B * u) * Math.cos(2 * B * v));
//
//    let acc = new THREE.Vector2(numU, numV);
//    acc.divideScalar(denom);
//    return acc;
//}






//
//
//
////MAKING A PARAMETRIC SURFACE FROM USER INPUT
////=============================================
//
//const parser = math.parser();
//
//
//
//// convert to formulas
//
//let xCoord = parser.evaluate('xCoord(u,v,t,a,b,c)='.concat(params.xCoordText));
//
//let yCoord = parser.evaluate('yCoord(u,v,t,a,b,c)='.concat(params.yCoordText));
//
//let zCoord = parser.evaluate('zCoord(u,v,t,a,b,c)='.concat(params.zCoordText));
//
//





//=============================================
//Stuff for all Surfaces
//=============================================

//
////=====END OF SURFACE DEFINITION
function rescaleU(u) {
    return params.uPercent * (uMax - uMin) * u + uMin;
}

function rescaleV(v) {
    return params.vPercent * (vMax - vMin) * v + vMin;
}


function surface(u, v) {
    return new THREE.Vector3(X(u, v), Z(u, v), -Y(u, v));
}


function equationUpdate() {

}



//
//
//
//
//const parser = math.parser();
//
//let a = params.a;
//let b = params.b;
//let c = params.c;
//
//
//let X = parser.evaluate('X(u,v,t,a,b,c)='.concat(params.xCoordText));
//
//let Y = parser.evaluate('Y(u,v,t,a,b,c)='.concat(params.yCoordText));
//
//
//let Z = parser.evaluate('Z(u,v,t,a,b,c)='.concat(params.zCoordText));
//
//
//function surface(u, v, t) {
//    return new THREE.Vector3(X(u, v, t, a, b, c), Z(u, v, t, a, b, c), -Y(u, v, t, a, b, c));
//}
//
//
//
////===== STUFF TO REPLACE LATER ==========
//
//function surfaceParamsUpdate() {
//    A = params.a;
//    B = params.b;
//    //c = params.c;
//}

//function rescaleU(u) {
//    return 12.5 * u - 6.28;
//}
//
//function rescaleV(v) {
//    return 12.5 * v - 6.28;
//}
//



////=====END OF REPLACE LATER 
//
//
//
//
////======CHRISTOFFEL SYMBOL TRASH:
//
////compute the metric from the parameterization
//
//
//function metric() {
//    //calculate the components EFG of the first fundamental form of the surface at point;
//
//    const x = math.parse(params.xCoordText);
//    const y = math.parse(params.yCoordText);
//    const z = math.parse(params.zCoordText);
//    const u = math.parse('u');
//    const v = math.parse('v');
//
//
//
//    //===calculate derivatives of parameterization
//    const RXu = math.derivative(x, u).toString();
//    const RYu = math.derivative(y, u).toString();
//    const RZu = math.derivative(z, u).toString();
//
//
//    const RXv = math.derivative(x, v);
//    const RYv = math.derivative(y, v);
//    const RZv = math.derivative(z, v);
//
//
//    //calculate the metric
//    //this is not working from here to below yet:
//    //need to figure out how to do symbolic math!
//    const E = math.parse('RXu*RXu+RYu*RYu+RZu*RZu');
//    const F = math.parse('RXu*RXv+RYu*RYv+RZu*RZv');
//    const G = math.parse('RXv*RXv+RYv*RYv+RZv*RZv');
//
//    let g = [E, F, G];
//
//
//    //===derivatives of the metric:
//    let Eu = math.derivative(E, u);
//    let Fu = math.derivative(F, u);
//    let Gu = math.derivative(G, u);
//
//    let gu = [Eu, Fu, Gu];
//
//    let Ev = math.derivative(E, v);
//    let Fv = math.derivative(F, v);
//    let Gv = math.derivative(G, v);
//
//    let gv = [Ev, Fv, Gv];
//
//
//}
//
//
//
//
//
//
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
//    let num = A * A * ((uP * uP + vP * vP) * Math.sin(u) * Math.sin(v) - 2 * uP * vP * Math.cos(u) * Math.cos(v));
//
//    let numU = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * u) * Math.sin(B * v) * Math.sin(B * v) - 2 * Math.cos(B * u) * Math.cos(B * u) * uP * vP * Math.sin(2 * B * v));
//
//    let numV = A * A * B * B * B * ((uP * uP + vP * vP) * Math.sin(2 * B * v) * Math.sin(B * u) * Math.sin(B * u) - 2 * Math.cos(B * v) * Math.cos(B * v) * uP * vP * Math.sin(2 * B * u));
//
//    let denom = 2 + A * A * B * B * (1 - Math.cos(2 * B * u) * Math.cos(2 * B * v));
//
//    let acc = new THREE.Vector2(numU, numV);
//    acc.divideScalar(denom);
//    return acc;
//}
//
//
//
//
//
//
//
//
//
//function equationUpdate() {
//
//    a = params.a;
//    b = params.b;
//    c = params.c;
//
//    X = parser.evaluate('X(u,v,t,a,b,c)='.concat(params.xCoordText));
//
//    Y = parser.evaluate('Y(u,v,t,a,b,c)='.concat(params.yCoordText));
//
//    Z = parser.evaluate('Z(u,v,t,a,b,c)='.concat(params.zCoordText));
//
//
//}


export {
    // acceleration,
    surface,
    surfaceParamsUpdate,
    rescaleU,
    rescaleV,
    equationUpdate
}
