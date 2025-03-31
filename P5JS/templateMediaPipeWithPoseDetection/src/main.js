import './style.css'
import p5 from 'p5';
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Define hand connections manually since GestureRecognizer.HAND_CONNECTIONS might not be available
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // Index finger
  [5, 9], [9, 10], [10, 11], [11, 12],      // Middle finger
  [9, 13], [13, 14], [14, 15], [15, 16],    // Ring finger
  [13, 17], [17, 18], [18, 19], [19, 20],   // Pinky
  [0, 17], [5, 9], [9, 13], [13, 17]        // Palm
];

const video = document.getElementById("webcam");
const canvasElement = document.createElement("canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

let gestureRecognizer;
let runningMode = "VIDEO";
let results = undefined;
let lastVideoTime = -1;
var mirror = true;

// Initialize video dimensions
if (video) {
  video.width = document.body.clientWidth;
  video.height = document.body.clientHeight;
  
  canvasElement.width = video.width;
  canvasElement.height = video.height;
  
  // Request webcam access directly
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: document.body.clientWidth },
        height: { ideal: document.body.clientHeight }
      }
    })
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
      video.addEventListener("loadeddata", () => {
        initGestureRecognizer();
      });
    })
    .catch(function(err) {
      console.error("Error accessing webcam: ", err);
    });
  }
}

// Initialize MediaPipe Gesture Recognizer
async function initGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  });
  
  // Start the prediction loop once the recognizer is loaded
  predictWebcam();
}

// Function to detect if a hand is open or closed based on gesture results
function getHandOpenStatus(gestureName) {
  // Map common gesture names to open/closed status
  const openGestures = ["Open_Palm", "Victory", "Thumb_Up", "Thumb_Down", "ILoveYou"];
  const closedGestures = ["Closed_Fist", "Rock", "OK"];
  
  if (openGestures.includes(gestureName)) return true;
  if (closedGestures.includes(gestureName)) return false;
  
  // Default to closed if unknown
  return true;
}

// Main prediction function
async function predictWebcam() {
  // Make sure video is initialized and gesture recognizer is ready
  if (!video || video.readyState < 2 || !gestureRecognizer) {
    requestAnimationFrame(predictWebcam);
    return;
  }

  // Process video frame if the time has changed
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try {
      const nowInMs = Date.now();
      results = gestureRecognizer.recognizeForVideo(video, nowInMs);
    } catch (error) {
      console.error("Error in gesture recognition:", error);
    }
  }
  
  // Continue the prediction loop
  requestAnimationFrame(predictWebcam);
}

// P5.js sketch for visualization
new p5(p5js => {  
  let webcamCanvas;

  p5js.setup = function setup() {
    p5js.createCanvas(document.body.clientWidth, document.body.clientHeight);
    webcamCanvas = p5js.createGraphics(p5js.width, p5js.height);
  };

  p5js.draw = function draw() {
    p5js.clear();
    
    // Display webcam video
    if (video && video.readyState >= 2) {
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
    
    // Process and display gesture recognition results
    if (results && results.landmarks) {
      // Draw hand landmarks
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        
        // Draw landmarks as red dots
        p5js.fill(255, 0, 0);
        p5js.stroke(0);
        p5js.strokeWeight(2);
        
        landmarks.forEach((pt) => {
          let x = pt.x;
          if (mirror) x = 1 - x;
          p5js.ellipse(x * p5js.width, pt.y * p5js.height, 10, 10);
        });
        
        // Draw connections between landmarks using our defined HAND_CONNECTIONS
        p5js.stroke(0, 255, 0);
        p5js.strokeWeight(3);
        
        // Using our manually defined hand connections
        HAND_CONNECTIONS.forEach(conn => {
          const start = conn[0];
          const end = conn[1];
          
          if (landmarks[start] && landmarks[end]) {
            let startX = landmarks[start].x;
            let endX = landmarks[end].x;
            
            if (mirror) {
              startX = 1 - startX;
              endX = 1 - endX;
            }
            
            p5js.line(
              startX * p5js.width, landmarks[start].y * p5js.height,
              endX * p5js.width, landmarks[end].y * p5js.height
            );
          }
        });
        
        // Display gesture information
        if (results.gestures && results.gestures.length > i) {
          const gesture = results.gestures[i];
          if (gesture && gesture.length > 0) {
            // Get the top gesture (highest confidence)
            const topGesture = gesture[0];
            const handedness = results.handednesses[i][0].displayName;
            
            // Get wrist position for text placement
            const wrist = landmarks[0];
            let wristX = wrist.x;
            if (mirror) wristX = 1 - wristX;
            
            // Determine if hand is open or closed
            const isOpen = getHandOpenStatus(topGesture.categoryName);
            
            // Display gesture information
            p5js.fill(255);
            p5js.noStroke();
            p5js.textSize(20);
            p5js.textAlign(p5js.CENTER);
            
            // Display gesture name and confidence
            p5js.text(
              `${topGesture.categoryName} (${(topGesture.score * 100).toFixed(0)}%)`,
              wristX * p5js.width,
              wrist.y * p5js.height - 60
            );
            
            // Display handedness
            p5js.text(
              handedness,
              wristX * p5js.width, 
              wrist.y * p5js.height - 30
            );
            
            // Display open/closed status
            p5js.text(
              isOpen ? "OPEN" : "CLOSED",
              wristX * p5js.width,
              wrist.y * p5js.height - 90
            );
          }
        }
      }
    }
  };
}, document.getElementById('sketch'));