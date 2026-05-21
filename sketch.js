// FULLSCREEN STYLE
// =====================================
let style = document.createElement('style');
style.innerHTML = `
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: rgb(18, 40, 18);
}
canvas {
  display: block;
}
`;
document.head.appendChild(style);

// =====================================
// VARIABLES
// =====================================
let tile = 40;
let cols;
let rows;
let maze = [];
let wallData = [];
let player;
let exitCell;
let state = "intro";
let bloodDrops = [];
let fairyAngle = 0;

// 웅덩이 함정(보이지 않음) 관련 변수
let puddles = [];
let minigameData = {};

// =====================================
// SETUP
// =====================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  initGame();
  setTimeout(() => {
    state = "game";
  }, 2200);
}

// =====================================
// INIT GAME
// =====================================
function initGame() {
  cols = floor(width / tile);
  rows = floor(height / tile);

  if (cols % 2 === 0) cols--;
  if (rows % 2 === 0) rows--;

  maze = [];
  wallData = [];

  for (let y = 0; y < rows; y++) {
    maze[y] = [];
    wallData[y] = [];
    for (let x = 0; x < cols; x++) {
      maze[y][x] = 1;
      wallData[y][x] = createWallData();
    }
  }

  carve(1, 1);
  maze[1][1] = 0;

  exitCell = null;
  for (let x = cols - 2; x > 1; x--) {
    if (maze[rows - 2][x] === 0) {
      exitCell = { x: x, y: rows - 2 };
      break;
    }
  }

  if (!exitCell) {
    maze[rows - 2][cols - 2] = 0;
    maze[rows - 2][cols - 3] = 0;
    exitCell = { x: cols - 2, y: rows - 2 };
  }

  player = {
    x: tile + tile / 2,
    y: tile + tile / 2
  };

  bloodDrops = [];
  
  generatePuddles();
}

// =====================================
// GENERATE PUDDLES (웅덩이 생성)
// =====================================
function generatePuddles() {
  puddles = [];
  let emptyCells = [];
  
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (maze[y][x] === 0) {
        // 플레이어 시작 위치와 출구 근처에는 함정을 생성하지 않음
        if (dist(x, y, 1, 1) > 3 && dist(x, y, exitCell.x, exitCell.y) > 3) {
          emptyCells.push({ x: x, y: y });
        }
      }
    }
  }
  
  shuffle(emptyCells, true);
  let numPuddles = min(15, emptyCells.length); 
  
  for (let i = 0; i < numPuddles; i++) {
    puddles.push(emptyCells[i]);
  }
}

// =====================================
// WALL DATA
// =====================================
function createWallData() {
  let vines = [];
  let thorns = [];

  for (let i = 0; i < 2; i++) {
    vines.push({
      sx: random(3, tile - 3),
      c1x: random(-3, 3),
      c2x: random(-3, 3)
    });
  }

  for (let i = 0; i < 3; i++) {
    thorns.push({
      bx: random(4, tile - 4),
      by: random(4, tile - 4),
      w: random(3, 6),
      h: random(4, 7)
    });
  }

  return { vines: vines, thorns: thorns };
}

// =====================================
// DRAW
// =====================================
function draw() {
  if (state === "intro") {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(55);
    text("7조 한채연", width / 2, height / 2 - 20);
    textSize(20);
    fill(150, 255, 150);
    text("화면을 클릭하면 전체화면으로 전환됩니다.", width / 2, height / 2 + 40);
    return;
  }

  if (state === "gameover") {
    background(30, 0, 0);
    fill(130, 0, 0, 120);
    rect(0, 0, width, height);

    for (let b of bloodDrops) {
      fill(170, 0, 0);
      noStroke();
      ellipse(b.x, b.y, b.size, b.size);
      triangle(b.x - b.size / 2, b.y, b.x + b.size / 2, b.y, b.x, b.y - b.size * 1.5);
      
      b.y += b.speed;
      if (b.y > height + 80) {
        b.y = random(-300, 0);
        b.x = random(width);
      }
    }

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(65);
    text("GAME OVER", width / 2, height / 2 - 40);
    textSize(24);
    text("R 키를 눌러 다시 시작", width / 2, height / 2 + 35);
    return;
  }

  if (state === "clear") {
    background(10, 30, 10);
    fill(100, 255, 170);
    textAlign(CENTER, CENTER);
    textSize(65);
    text("GAME CLEAR", width / 2, height / 2 - 40);
    textSize(24);
    fill(255);
    text("R 키를 눌러 다시 시작", width / 2, height / 2 + 35);
    return;
  }

  // --- GAME & MINIGAME RENDERING ---
  // 배경을 짙은 초록(벽 색깔)으로 설정하여 여백 처리
  background(28, 95, 28);

  drawMaze();
  drawGardenDome(); 
  
  if (state === "game") {
    movePlayer();
  }

  drawPlayer();
  drawFairy();
  
  // 웅덩이 미니게임 화면 그리기
  if (state === "minigame") {
    handleMinigame();
  }
}

// =====================================
// MINIGAME LOGIC
// =====================================
function handleMinigame() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);
  
  drawSpeechBubble(player.x, player.y);

  let elapsed = millis() - minigameData.startTime;
  // 제한 시간을 15초에서 10초로 변경!
  let timeLeft = 10 - Math.floor(elapsed / 1000); 

  textAlign(CENTER, CENTER);
  
  fill(255, 100, 100);
  textSize(35);
  text(`앗, 숨겨진 웅덩이에 빠졌습니다!`, width / 2, height / 2 - 70);
  
  fill(255);
  textSize(45);
  text(`남은 시간: ${timeLeft}초`, width / 2, height / 2 - 10);

  fill(255, 255, 100);
  textSize(60);
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = "yellow";
  text(`[ ${minigameData.keyName} ] 키 연타! (${minigameData.count} / 20)`, width / 2, height / 2 + 70);
  drawingContext.shadowBlur = 0;

  if (timeLeft <= 0) {
    createBlood();
    state = "gameover";
  }
}

function drawSpeechBubble(x, y) {
  let msg = "으악!\n웅덩이에\n넘어졌다!";
  let bx = x;
  let by = y - 45; 
  
  push();
  fill(255);
  stroke(0);
  strokeWeight(2);
  
  triangle(x, y - 15, x - 8, y - 30, x + 8, y - 30);
  
  rectMode(CENTER);
  rect(bx, by - 25, 110, 70, 12);
  
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(14);
  textStyle(BOLD);
  text(msg, bx, by - 25);
  pop();
}

// =====================================
// MAZE GENERATION
// =====================================
function carve(x, y) {
  let dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]];
  shuffle(dirs, true);

  for (let d of dirs) {
    let nx = x + d[0];
    let ny = y + d[1];

    if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && maze[ny][nx] === 1) {
      maze[ny][nx] = 0;
      maze[y + d[1] / 2][x + d[0] / 2] = 0;
      carve(nx, ny);
    }
  }
}

// =====================================
// DRAW MAZE
// =====================================
function drawMaze() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let px = x * tile;
      let py = y * tile;

      if (maze[y][x] === 0) {
        // 길(바닥)을 갈색으로 따로 칠해줌
        fill(145, 110, 75);
        noStroke();
        rect(px, py, tile, tile);
      } else {
        // 벽 디테일(가시, 덩굴) 렌더링
        let data = wallData[y][x];

        stroke(65, 40, 15);
        strokeWeight(1.5);
        for (let v of data.vines) {
          beginShape();
          vertex(px + v.sx, py + tile);
          bezierVertex(
            px + v.sx + v.c1x, py + 18,
            px + v.sx + v.c2x, py + 8,
            px + v.sx, py
          );
          endShape();
        }
        noStroke();

        fill(245);
        for (let t of data.thorns) {
          let tx = px + t.bx;
          let ty = py + t.by;
          triangle(tx, ty - t.h, tx - t.w / 2, ty, tx + t.w / 2, ty);
        }
      }
    }
  }
}

// =====================================
// GARDEN DOME 🌿
// =====================================
function drawGardenDome() {
  if (!exitCell) return;
  let cx = exitCell.x * tile + tile / 2;
  let cy = exitCell.y * tile + tile / 2;

  noStroke();
  fill(34, 139, 34); 
  stroke(15, 70, 15);
  strokeWeight(2.5);
  arc(cx, cy + tile/4, tile + 12, tile + 16, PI, 0);
  noStroke();

  fill(50, 205, 50);
  circle(cx - tile/3, cy - tile/5, 14);
  circle(cx + tile/3, cy - tile/5, 14);
  circle(cx, cy - tile/2, 18);
  circle(cx - tile/5, cy - tile/3, 16);
  circle(cx + tile/5, cy - tile/3, 16);
  circle(cx - tile/4, cy, 12);
  circle(cx + tile/4, cy, 12);
  circle(cx, cy - tile/8, 15);

  fill(255, 215, 0);
  circle(cx - tile/2.5, cy - tile/10, 4);
  circle(cx + tile/2.5, cy - tile/10, 4);
  circle(cx - tile/4, cy - tile/2.5, 5);
  circle(cx + tile/4, cy - tile/2.5, 5);
  circle(cx, cy - tile/2.5, 6);
  circle(cx - tile/8, cy + tile/8, 4.5);
  circle(cx + tile/8, cy + tile/8, 4.5);
}

// =====================================
// MOVE PLAYER
// =====================================
function movePlayer() {
  let speed = 6;
  let nx = player.x;
  let ny = player.y;

  if (keyIsDown(87) || keyIsDown(UP_ARROW)) ny -= speed;
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) ny += speed;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) nx -= speed;
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) nx += speed;

  let hitbox = { left: nx - 5, right: nx + 5, top: ny - 10, bottom: ny + 11 };
  let left = floor(hitbox.left / tile);
  let right = floor(hitbox.right / tile);
  let top = floor(hitbox.top / tile);
  let bottom = floor(hitbox.bottom / tile);

  if (
    top >= 0 && bottom < rows && left >= 0 && right < cols &&
    maze[top][left] === 0 && maze[top][right] === 0 &&
    maze[bottom][left] === 0 && maze[bottom][right] === 0
  ) {
    player.x = nx;
    player.y = ny;

    let gx = floor(nx / tile);
    let gy = floor(ny / tile);

    if (exitCell && gx === exitCell.x && gy === exitCell.y) {
      state = "clear";
    }

    // 눈에 보이지 않는 웅덩이 함정 밟았을 때 처리!
    for (let i = puddles.length - 1; i >= 0; i--) {
      if (puddles[i].x === gx && puddles[i].y === gy) {
        state = "minigame";
        
        let keys = ['w', 'a', 's', 'd'];
        let chosen = random(keys); 
        
        minigameData = {
          keyToPress: chosen,
          keyName: chosen.toUpperCase(),
          count: 0,
          target: 20,
          startTime: millis()
        };
        
        puddles.splice(i, 1);
        break;
      }
    }

  } else {
    createBlood();
    state = "gameover";
  }
}

// =====================================
// PLAYER & FAIRY
// =====================================
function drawPlayer() {
  let x = player.x;
  let y = player.y;
  noStroke();
  fill(139, 69, 19);
  rect(x - 6, y - 12, 12, 18, 4);
  fill(255, 220, 200);
  ellipse(x, y - 5, 9, 10);
  fill(120, 55, 10);
  rect(x - 4.5, y - 11, 9, 4, 1.5);
  fill(255, 170, 210);
  rect(x - 3.5, y + 1, 7, 10, 2);
}

function drawFairy() {
  fairyAngle += 0.06;
  let fx = player.x + 12 + sin(fairyAngle) * 3;
  let fy = player.y - 6 + cos(fairyAngle) * 4;

  drawingContext.shadowBlur = 12;
  drawingContext.shadowColor = "yellow";
  fill(255, 255, 150);
  ellipse(fx, fy, 7);
  fill(255);
  ellipse(fx - 3, fy - 2, 3.5);
  drawingContext.shadowBlur = 0;
}

// =====================================
// BLOOD
// =====================================
function createBlood() {
  bloodDrops = [];
  for (let i = 0; i < 30; i++) {
    bloodDrops.push({
      x: random(width),
      y: random(-height, 0),
      speed: random(5, 12),
      size: random(10, 40)
    });
  }
}

// =====================================
// KEY & MOUSE
// =====================================
function keyPressed() {
  if ((state === "gameover" || state === "clear") && (key === 'r' || key === 'R')) {
    initGame();
    state = "game";
    return;
  }

  if (state === "minigame") {
    if (key.toLowerCase() === minigameData.keyToPress.toLowerCase()) {
      minigameData.count++;
      if (minigameData.count >= minigameData.target) {
        state = "game"; 
      }
    }
  }
}

function mousePressed() {
  let fs = fullscreen();
  fullscreen(!fs);
}

// =====================================
// RESIZE
// =====================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGame(); 
}