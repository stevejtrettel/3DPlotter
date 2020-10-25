//Import Stuff, Variables
//=============================================
import * as THREE from './libs/three.module.js';

import {
    params
} from './ui.js';



let points;
let scalingFactor = 5;
let curve;








function sphCoords(phi, theta) {
    let x = Math.cos(theta) * Math.sin(phi);
    let y = Math.sin(theta) * Math.sin(phi);
    let z = Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}






function nilFlow(v, s) {

    //v is a unit tangent vector


    //this is the geodesic from the origin
    let a = Math.sqrt(v.x * v.x + v.y * v.y);
    let c = v.z;
    let theta = Math.atan2(v.y, v.x);

    let x, y, z;

    if (c == 0) {
        x = s * Math.cos(theta);
        y = s * Math.sin(theta);
        z = 0;
    } else { //geodesic flow
        x = 2. * a / c * Math.sin(c * s / 2) * Math.cos(c * s / 2 + theta);
        y = 2. * a / c * Math.sin(c * s / 2) * Math.sin(c * s / 2 + theta);
        z = c * s + a * a / (2 * c * c) * (c * s - Math.sin(c * s));
    }
    return new THREE.Vector3(x, y, -z);
}





//take in a vector, spit out the curve 
function nilGeodesic(v) {

    points = [];


    let tubeWidth = params.width;
    //samples per unit length
    let samples = 1.;


    for (let i = 0; i < samples * params.length; i++) {

        let P = nilFlow(v, i / samples);

        //append points to the list
        points.push(P.multiplyScalar(scalingFactor));
    }

    //make a curve out of all the points
    curve = new THREE.CatmullRomCurve3(points);

    return curve

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



export {
    curveSpray,
    nilGeodesic,
    nilFlow,
    sphCoords
};
