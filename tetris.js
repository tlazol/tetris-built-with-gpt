// 変数の定義
const canvas = document.getElementById("game-board");
const ctx = canvas.getContext("2d");
const blockSize = 32;
const numRows = canvas.height / blockSize;
const numCols = canvas.width / blockSize;
let gameBoard = Array.from({ length: numRows }, () => Array(numCols).fill(0));
let currentBlock = null;
let score = 0;
// キラキラ
const particlesArray = [];
// ゲームの速度関連の変数
let speed = 1000; // 1秒 (1000ミリ秒)
let level = 1;
let linesClearedTotal = 0;

// ブロックの形状と色を定義
const blocks = [
  // I
  {
    shape: [
      [1, 1, 1, 1],
    ],
    color: "cyan",
  },
  // O
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "yellow",
  },
  // T
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "purple",
  },
  // S
  {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "green",
  },
  // Z
  {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "red",
  },
  // J
  {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "blue",
  },
  // L
  {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "orange",
  },
];

// ブロックを生成する関数
function createBlock() {
  const block = blocks[Math.floor(Math.random() * blocks.length)];
  return {
    x: Math.floor(numCols / 2) - Math.ceil(block.shape[0].length / 2),
    y: 0,
    shape: block.shape,
    color: block.color,
  };
}

currentBlock = createBlock();

// ブロックを描画する関数を更新
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
  ctx.strokeStyle = "black";
  ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);

  // グラデーションの追加
  const gradient = ctx.createLinearGradient(
    x * blockSize,
    y * blockSize,
    (x + 1) * blockSize,
    (y + 1) * blockSize
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(x * blockSize + 2, y * blockSize + 2, blockSize - 4, blockSize - 4);

  // 点滅アニメーションの追加
  const blink = 0.5 + 0.5 * Math.sin(performance.now() / 300);
  ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
  ctx.fillRect(x * blockSize + 2, y * blockSize + 2, blockSize - 4, blockSize - 4);
}

// ゲームボード全体を描画する関数
function drawGameBoard() {
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      if (gameBoard[y][x]) {
        drawBlock(x, y, gameBoard[y][x]);
      }
    }
  }
}

// 現在のブロックを描画する関数
function drawCurrentBlock() {
  for (let y = 0; y < currentBlock.shape.length; y++) {
    for (let x = 0; x < currentBlock.shape[y].length; x++) {
      if (currentBlock.shape[y][x]) {
        drawBlock(currentBlock.x + x, currentBlock.y + y, currentBlock.color);
      }
    }
  }
}

// ブロックの衝突判定を行う関数
function checkCollision(x, y, shape) {
  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j] && (gameBoard[y + i] && gameBoard[y + i][x + j]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// ブロックを回転させる関数
function rotateBlock() {
  const newShape = currentBlock.shape[0].map((_, i) => currentBlock.shape.map(row => row[i])).reverse();
  if (!checkCollision(currentBlock.x, currentBlock.y, newShape)) {
    currentBlock.shape = newShape;
  }
}

// ブロックを固定する関数
function fixBlock() {
  for (let y = 0; y < currentBlock.shape.length; y++) {
    for (let x = 0; x < currentBlock.shape[y].length; x++) {
      if (currentBlock.shape[y][x]) {
        gameBoard[currentBlock.y + y][currentBlock.x + x] = currentBlock.color;
      }
    }
  }
}

// ブロックを移動する関数
function moveBlock(moveX, moveY) {
  if (!checkCollision(currentBlock.x + moveX, currentBlock.y + moveY, currentBlock.shape)) {
    currentBlock.x += moveX;
    currentBlock.y += moveY;
  } else if (moveY === 1) {
    fixBlock();
    checkLines();
    currentBlock = createBlock();
  }
}

// パーティクルクラス
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 5 + 1;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.size -= 0.1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

// パーティクルを生成する関数
function createParticles(x, y, color) {
  for (let i = 0; i < 5; i++) {
    particlesArray.push(new Particle(x * blockSize + blockSize / 2, y * blockSize + blockSize / 2, color));
  }
}

// パーティクルを更新および描画する関数
function updateAndDrawParticles() {
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
    particlesArray[i].draw();

    if (particlesArray[i].size <= 0.1) {
      particlesArray.splice(i, 1);
      i--;
    }
  }
}

// 描画関数を更新
function draw() {
  // キャンバスをクリア
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ゲームボード全体を描画
  drawGameBoard();

  // 現在のブロックを描画
  drawCurrentBlock();

  // パーティクルを更新および描画
  updateAndDrawParticles();

  // 次のフレームへ
  requestAnimationFrame(draw);
}

// ゲームオーバーを検出する関数
function detectGameOver() {
  for (let x = 0; x < numCols; x++) {
    if (gameBoard[0][x] !== 0) {
      return true;
    }
  }
  return false;
}

// ゲームオーバーのメッセージを表示する関数
function displayGameOver() {
  console.log("Game Over"); // このログが表示されるか確認

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ゲームオーバーのメッセージを表示
  ctx.fillStyle = "black";
  ctx.font = "48px 'Arial'";
  ctx.fillText("Game Over", canvas.width / 2 - 100, canvas.height / 2 - 50);

  // クリックで再スタートのメッセージを表示
  ctx.font = "24px 'Arial'";
  ctx.fillText("Click to restart", canvas.width / 2 - 75, canvas.height / 2);

  // キャンバスをクリックしたら、ゲームを再開
  canvas.addEventListener("click", () => {
    location.reload();
  });
}

// ゲームをリセットする関数
function resetGame() {
  gameBoard = Array.from({ length: numRows }, () => Array(numCols).fill(0));
  score = 0;
  document.getElementById("score").textContent = score;
  currentBlock = createBlock();
}

// キーボードのイベントリスナーを更新
document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (key === "ArrowLeft") {
    moveBlock(-1, 0);
  } else if (key === "ArrowRight") {
    moveBlock(1, 0);
  } else if (key === "ArrowUp") {
    rotateBlock();
  } else if (key === "ArrowDown") {
    moveBlock(0, 1);
  } else if (key === " ") {
    // スペースキーでゲームをリセット
    if (detectGameOver()) {
      resetGame();
    }
  }
});

// スピードを更新する関数
function updateSpeed() {
  if (linesClearedTotal >= 10 * level) {
    level++;
    speed = 1000 * Math.pow(0.9, level - 1);
  }
  document.getElementById("level").textContent = level;
}

// 行が揃っているかチェックし、スコアを更新する関数を更新
function checkLines() {
  let linesCleared = 0;

  for (let y = 0; y < numRows; y++) {
    if (gameBoard[y].every(cell => cell !== 0)) {
      for (let x = 0; x < numCols; x++) {
        createParticles(x, y, gameBoard[y][x]);
      }
      gameBoard.splice(y, 1);
      gameBoard.unshift(Array(numCols).fill(0));
      linesCleared++;
    }
  }

  linesClearedTotal += linesCleared;

  if (linesCleared > 0) {
    score += 10 * (2 ** (linesCleared - 1));
    document.getElementById("score").textContent = score;
    updateSpeed();
  }
}

// ゲームをリセットする関数を更新
function resetGame() {
  gameBoard = Array.from({ length: numRows }, () => Array(numCols).fill(0));
  score = 0;
  level = 1;
  speed = 1000;
  linesClearedTotal = 0;
  document.getElementById("score").textContent = score;
  document.getElementById("level").textContent = level;
  currentBlock = createBlock();
}

// ゲームループ関数を更新
function gameLoop() {
  const startTime = performance.now();

  moveBlock(0, 1);

  if (detectGameOver()) {
    displayGameOver();
  } else {
    draw();
    const elapsedTime = performance.now() - startTime;
    setTimeout(gameLoop, Math.max(speed - elapsedTime, 0));
  }
}

// ゲームを開始
gameLoop();