        //Import Stuff
        //=============================================
        import * as THREE from './libs/three.module.js';

        import {
            OrbitControls
        } from './libs/OrbitControls.js';

        import Stats from './libs/stats.module.js';



        //Import My Own Stuff
        //=============================================

        import {
            params,
            createGUI
        } from './ui.js';


        import {
            scene,
            camera,
            createScene,
            updateScene,
        } from './scene.js';






        //Global Variables
        //=============================================

        let renderer, controls, container;
        let stats;

        let pmremGenerator;




        //Scene-Independent Functions
        //=============================================

        function init() {

            // Get a reference to the container element that will hold our scene
            container = document.querySelector('#scene-container');

            stats = initStats();


            createRenderer();


            //from scene file.
            createScene();


            createControls();
            createGUI();



            // listener
            window.addEventListener('resize', onWindowResize, false);

        }





        function initStats(type) {

            var panelType = (typeof type !== 'undefined' && type) && (!isNaN(type)) ? parseInt(type) : 0;
            var stats = new Stats();

            stats.showPanel(panelType); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(stats.dom);

            return stats;
        }







        function createRenderer() {
            // renderer
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);


            // set the gamma correction so that output colors look
            // correct on our screens
            renderer.gammaFactor = 2.2;
            renderer.gammaOutput = true;
            renderer.physicallyCorrectLights = true;
            // tone mapping
            renderer.toneMapping = THREE.NoToneMapping;
            renderer.outputEncoding = THREE.sRGBEncoding;




            //adding shadow capabilities to the renderer
            //            renderer.shadowMap.enabled = true;
            //            renderer.shadowMap.type = THREE.PCFSoftShadowMap;


            // add the output of the renderer to the html element
            container.appendChild(renderer.domElement);



            //make the pmrem generator if we need it
            pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileCubemapShader();


        }



        function createControls() {
            // controls
            controls = new OrbitControls(camera, container);
            controls.addEventListener('change', render);
            controls.minDistance = 10;
            controls.maxDistance = 150;
            controls.enablePan = true;
        }





        function onWindowResize() {

            var width = window.innerWidth;
            var height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);

        }



        function render() {


            renderer.render(scene, camera);


        }



        function animate() {

            requestAnimationFrame(animate);

            stats.begin();

            updateScene();
            render();

            stats.end();

        }





        init();
        animate();




        export {
            pmremGenerator
        };
