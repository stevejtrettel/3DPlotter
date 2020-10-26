//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import {
    params
} from './ui.js';



let A, B;


let uMin, uMax, uRng, vMin, vMax, vRng;



uMin = -5;
uMax = 5;
vMin = -5;
vMax = 5;
let sMin = -3;
let sMax = 5;


const parser = math.parser();

let a = params.a;
let b = params.b;
let c = params.c;


let X = parser.evaluate('X(s,t,a,b,c)='.concat(params.xCoordText));

let Y = parser.evaluate('Y(s,t,a,b,c)='.concat(params.yCoordText));


let F = parser.evaluate('F(x,y,t,a,b,c)='.concat(params.zCoordText));


function surface(u, v, t) {
    return new THREE.Vector3(u, F(u, v, t, a, b, c), -v);
}


function planeCurve(s, t) {
    return new THREE.Vector3(X(s, t, a, b, c), 0, -Y(s, t, a, b, c));
}


function surfaceCurve(s, t) {
    let x = X(s, t, a, b, c);
    let y = Y(s, t, a, b, c);
    let z = F(x, y, t, a, b, c);
    return new THREE.Vector3(x, z, -y);
}



function surfaceSheet(w, s, t) {
    let x = X(s, t, a, b, c);
    let y = Y(s, t, a, b, c);
    let z = F(x, y, t, a, b, c);
    return new THREE.Vector3(x, w * z, -y);
}



function plane(u, v, t) {
    return new THREE.Vector3(u, 0, -v);
}


function rescaleU(u) {
    return params.uPercent * (uMax - uMin) * u + uMin;
}

function rescaleV(v) {
    return params.vPercent * (vMax - vMin) * v + vMin;
}

function rescaleS(s) {
    return (sMax - sMin) * s + sMin;
}


//function surface(u, v) {
//    return new THREE.Vector3(X(u, v), Z(u, v), -Y(u, v));
//}


function equationUpdate() {

    X = parser.evaluate('X(s,t,a,b,c)='.concat(params.xCoordText));

    Y = parser.evaluate('Y(s,t,a,b,c)='.concat(params.yCoordText));


    F = parser.evaluate('F(x,y,t,a,b,c)='.concat(params.zCoordText));


}


//
//
////===== STUFF TO REPLACE LATER ==========
//
function surfaceParamsUpdate() {
    A = params.a;
    B = params.b;
    //c = params.c;
}







export {
    surface,
    plane,
    planeCurve,
    surfaceCurve,
    surfaceSheet,
    surfaceParamsUpdate,
    rescaleU,
    rescaleV,
    rescaleS,
    equationUpdate
}
