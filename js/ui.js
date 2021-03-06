import {
    GUI
} from './libs/dat.gui.module.js';

let gui;




let xCoordText = "u";

let yCoordText = "v";

let zCoordText = "(1+a)*sin(u)*sin(v)+0.3*sin(t)*sin(u*v)";


// define the variables that live in the gui
let params = {
    uPercent: 1,
    vPercent: 1,
    a: 0.5,
    b: 0.5,
    c: 0.2,
    p: 0.39,
    angle: 3.14,
    spray: 1,
    wiggle: 0.2,
    length: 10,
    step: 0.3,
    xCoordText: xCoordText,
    yCoordText: yCoordText,
    zCoordText: zCoordText,
    drawTex: 0,
    color: 0x1e43,
    curveColor: 0x0,
    intensity: 0.5,
    metal: 0.,
    rough: 0.,
    res: 75,
    width: 0.4,
    zRotation: 0.,
    tumble: 0
};



function createGUI() {
    gui = new GUI();

    gui.width = 400;

    gui.domElement.style.userSelect = 'none';


    let domain = gui.addFolder('Surface');

    domain.add(params, 'uPercent', 0, 1, 0.01);

    domain.add(params, 'vPercent',
        0, 1, 0.01);
    domain.add(params, 'a', 0, 1, 0.01).name('A');
    domain.add(params, 'b', 0, 1, 0.01).name('B');
    domain.add(params, 'c', 0, 1, 0.01).name('C');

    domain.close();

//    gui.add(params, 'xCoordText').name('X'
//        .concat('a,b,c,t'.sub().concat('(u,v)=')));
//    gui.add(params, 'yCoordText').name('Y'
//        .concat('a,b,c,t'.sub().concat('(u,v)=')));
//    gui.add(params, 'zCoordText').name('Z'
//        .concat('a,b,c,t'.sub().concat('(u,v)=')));

    let parameters = gui.addFolder('Geodesic');

    parameters.add(params, 'p', 0, 1, 0.01).name('Position');
    parameters.add(params, 'angle', 0, 6.28, 0.01).name('Angle');
    parameters.add(params, 'spray', 1, 10, 1).name('Spray');

    parameters.add(params, 'wiggle', 0, 1, 0.01).name('Wiggle');
    parameters.add(params, 'length', 0.1, 100, 0.1).name('Length');
    parameters.add(params, 'step', 0.01, 0.5, 0.01).name('StepSize');


    let graphics = gui.addFolder('Graphics');


    graphics.add(params, 'drawTex', {
        No: 0,
        Yes: 1
    }).name('Draw Coordinate Grid');

    graphics.addColor(params, 'color')
        .name('Surface Color');

    graphics.addColor(params, 'curveColor')
        .name('Geodesic Color');

    graphics.add(params, 'intensity', 0., 1., 0.05).name('Brightness');
    graphics.add(params, 'metal', 0., 1., 0.05).name('Metalicity');
    graphics.add(params, 'rough', 0., 1., 0.05).name('Roughness');
    graphics.add(params, 'res', 10, 150, 5);
    graphics.add(params, 'width', 0.01, 1, 0.01).name('TubeWidth');
    graphics.add(params, 'zRotation', 0, 1, 0.05).name('Rotate');
    graphics.add(params, 'tumble', 0, 1, 0.05).name('Tumble');


    graphics.close();
}


export {
    params,
    createGUI
};
