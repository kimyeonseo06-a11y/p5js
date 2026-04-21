/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates hand tracking on live video through ml5.handPose.
 */

let handPose;
let video;
let hands = [];

let drawing = false;
let prevX = null;
let prevY = null;


function preload() {
  // Load the handPose model
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // start detecting hands from the webcam video
  handPose.detectStart(video, gotHands);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

   if (hands.length > 0) {
    let hand = hands[0];

    // 👉 keypoints에서 4번(엄지), 8번(검지)
    let thumb = hand.keypoints[4];
    let index = hand.keypoints[8];

    // 거리 계산
    let d = dist(thumb.x, thumb.y, index.x, index.y);

    // 👉 닿았다고 판단 (값 조절 가능)
    if (d < 40) {
      drawing = true;

      let x = index.x;
      let y = index.y;

      if (prevX !== null) {
        stroke(255, 0, 0);
        strokeWeight(5);
        line(prevX, prevY, x, y);
      }

      prevX = x;
      prevY = y;

    } else {
      drawing = false;
      prevX = null;
      prevY = null;
    }
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 10);
      
    }
  }
}

// Callback function for when handPose outputs data
function gotHands(results) {
  // save the output to the hands variable
  hands = results;
}