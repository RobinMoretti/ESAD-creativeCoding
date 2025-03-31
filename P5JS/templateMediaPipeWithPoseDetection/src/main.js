import './style.css'

import {Hands} from '@mediapipe/hands';
import {Camera} from '@mediapipe/camera_utils';

import p5 from 'p5';

const video = document.getElementById("webcam");
var mirror = true;
var handResults = undefined;

// Camera parameters
var camera = new Camera(video, {
    onFrame: async () => {
        if(hands){
            await hands.send({
                image: video,
            });
        }
    },
    facingMode: "user", // Change to "user" to use front camera
    width: document.body.clientWidth,
    height: document.body.clientHeight,
});
  
camera.start();

var handOptions = {
    maxNumHands: 2, // change max number of detected hands here
    modelComplexity: 1,
    minDetectionConfidence: 0.5, // hand detection confidence threshold
    minTrackingConfidence: 0.5,
};
  
var hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    },
});

hands.setOptions(handOptions);

hands.onResults(onResults);

function onResults(results) {
    // Only modify landmarks if mirror is true
    if (results.multiHandLandmarks && mirror) {
        results.multiHandLandmarks.forEach((h) => {
        h.forEach((pt) => {
            pt.x = pt.x * -1 + 1;
        });
        });
    }

    if (results.multiHandedness && mirror) {
        results.multiHandedness.forEach((h) => {
        	h.label = h.label === "Left" ? "Right" : "Left";
        });
    }
    handResults = results;
}

var webcamResult = undefined;

new p5(p5js => {  
    let webcamCanvas;
  
    p5js.setup = function setup() {
        p5js.createCanvas(document.body.clientWidth, document.body.clientHeight);
        webcamCanvas = p5js.createGraphics(p5js.width, p5js.height);
    };
  
    p5js.draw = function draw() {
        p5js.clear();
        
        if (video.readyState >= 2) { // Check if video is loaded
            webcamCanvas.clear();
            webcamCanvas.drawingContext.drawImage(video, 0, 0, webcamCanvas.width, webcamCanvas.height);
            
            if (mirror) {
                p5js.push();
                p5js.translate(p5js.width, 0);
                p5js.scale(-1, 1);
                p5js.image(webcamCanvas, 0, 0, p5js.width, p5js.height);
                p5js.pop();
            } else {
                p5js.image(webcamCanvas, 0, 0, p5js.width, p5js.height);
            }
        }
        
        p5js.fill(255, 0, 0);
        p5js.stroke(0);
        p5js.strokeWeight(2);
        
        if (handResults && handResults.multiHandLandmarks) {
            handResults.multiHandLandmarks.forEach((h) => {
                h.forEach((pt) => {
                    p5js.ellipse(pt.x * p5js.width, pt.y * p5js.height, 10, 10);
                });
            });
        }
    };
}, document.getElementById('sketch'));