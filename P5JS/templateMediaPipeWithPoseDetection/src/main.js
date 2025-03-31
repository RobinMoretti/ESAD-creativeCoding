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

// Global variables for hand tracking
const video = document.getElementById("webcam");
const canvasElement = document.createElement("canvas");
const canvasCtx = canvasElement.getContext("2d");
const drawingUtils = new DrawingUtils(canvasCtx);

let gestureRecognizer;
let runningMode = "VIDEO";
let results = undefined;
let lastVideoTime = -1;
var mirror = true;

// Global P5 variables for hand states and positions
let handStates = {
  left: {
    isOpen: false,
    position: { x: 0, y: 0 },
    gesture: "",
    confidence: 0,
    landmarks: []
  },
  right: {
    isOpen: false,
    position: { x: 0, y: 0 },
    gesture: "",
    confidence: 0,
    landmarks: []
  }
};

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
  return false;
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
      
      // Update global hand states
      updateHandStates(results);
      
    } catch (error) {
      console.error("Error in gesture recognition:", error);
    }
  }
  
  // Continue the prediction loop
  requestAnimationFrame(predictWebcam);
}

// Function to update global hand states based on recognition results
function updateHandStates(results) {
  if (!results || !results.landmarks) return;
  
  // Reset hand states for cases where hands disappear
  handStates.left.landmarks = [];
  handStates.right.landmarks = [];
  
  for (let i = 0; i < results.landmarks.length; i++) {
    if (!results.handednesses || !results.handednesses[i] || !results.handednesses[i][0]) continue;
    
    const handedness = results.handednesses[i][0].displayName.toLowerCase();
    const landmarks = results.landmarks[i];
    const wrist = landmarks[0]; // Wrist is always index 0
    
    // Store landmarks
    handStates[handedness].landmarks = landmarks;
    
    // Update position (adjusted for mirroring)
    let wristX = wrist.x;
    if (mirror) wristX = 1 - wristX;
    handStates[handedness].position = { x: wristX, y: wrist.y };
    
    // Update gesture information if available
    if (results.gestures && results.gestures.length > i && results.gestures[i].length > 0) {
      const topGesture = results.gestures[i][0];
      handStates[handedness].gesture = topGesture.categoryName;
      handStates[handedness].confidence = topGesture.score;
      handStates[handedness].isOpen = getHandOpenStatus(topGesture.categoryName);
    }
  }
}

// P5.js sketch
new p5(p5js => {  
  let webcamCanvas;

  p5js.setup = function setup() {
    p5js.createCanvas(document.body.clientWidth, document.body.clientHeight);
    webcamCanvas = p5js.createGraphics(p5js.width, p5js.height);
  };

  p5js.draw = function draw() {
    p5js.clear();
    
    // Display webcam video
    drawWebcamFeed(p5js, webcamCanvas);
    
    // Process and display hand tracking results
    if (results && results.landmarks) {
      for (let i = 0; i < results.landmarks.length; i++) {
        if (!results.handednesses || !results.handednesses[i] || !results.handednesses[i][0]) continue;
        
        const handedness = results.handednesses[i][0].displayName.toLowerCase();
        drawHandLandmarks(p5js, handStates[handedness].landmarks, handedness);
        drawHandInfo(p5js, handedness);
      }
    }
  };
  
  // Function to draw webcam feed
  function drawWebcamFeed(p, canvas) {
    if (!video || video.readyState < 2) return;
    
    canvas.clear();
    canvas.drawingContext.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (mirror) {
      p.push();
      p.translate(p.width, 0);
      p.scale(-1, 1);
      p.image(canvas, 0, 0, p.width, p.height);
      p.pop();
    } else {
      p.image(canvas, 0, 0, p.width, p.height);
    }
  }
  
  // Function to draw hand landmarks and connections
  function drawHandLandmarks(p, landmarks, handedness) {
    if (!landmarks || landmarks.length === 0) return;
    
    // Draw landmarks as dots
    p.fill(255, 0, 0);
    p.stroke(0);
    p.strokeWeight(2);
    
    landmarks.forEach((pt) => {
      let x = pt.x;
      if (mirror) x = 1 - x;
      p.ellipse(x * p.width, pt.y * p.height, 10, 10);
    });
    
    // Draw connections between landmarks
    p.stroke(0, 255, 0);
    p.strokeWeight(3);
    
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
        
        p.line(
          startX * p.width, landmarks[start].y * p.height,
          endX * p.width, landmarks[end].y * p.height
        );
      }
    });
  }
  
  // Function to draw hand information (gesture, confidence, open/closed status)
  function drawHandInfo(p, handedness) {
    const handState = handStates[handedness];
    if (!handState.landmarks || handState.landmarks.length === 0) return;
    
    const position = handState.position;
    
    // Display hand information
    p.fill(255);
    p.noStroke();
    p.textSize(20);
    p.textAlign(p.CENTER);
    
    // Display gesture name and confidence
    p.text(
      `${handState.gesture} (${(handState.confidence * 100).toFixed(0)}%)`,
      position.x * p.width,
      position.y * p.height - 60
    );
    
    // Display handedness
    p.text(
      handedness.toUpperCase(),
      position.x * p.width, 
      position.y * p.height - 30
    );
    
    // Display open/closed status
    p.text(
      handState.isOpen ? "OPEN" : "CLOSED",
      position.x * p.width,
      position.y * p.height - 90
    );
  }
  
}, document.getElementById('sketch'));