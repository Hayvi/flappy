const RAD = Math.PI / 180;
const scrn = document.getElementById("canvas");
const sctx = scrn.getContext("2d");
scrn.tabIndex = 1;

let shakeX = 0, shakeY = 0;
let countdown = 0;
let stars = [];
let birdTrail = [];
let roundHistory = [];
let balance = 1000;
let betAmount = 10;
let cashedOut = false;
let winAmount = 0;
let autoCashOut = 0; // 0 = disabled
let speedLines = [];
let confetti = [];
let stats = { wins: 0, losses: 0, biggestWin: 0, totalProfit: 0, streak: 0 };
let milestoneFlash = 0;
let lastMilestone = 0;
let soundEnabled = true;
let canDoubleDown = false;
let lastWin = false;
let assetsLoaded = 0;
let totalAssets = 9;
let profitPopup = { show: false, amount: 0, y: 0, life: 0 };

// Generate stars
for (let i = 0; i < 50; i++) {
  stars.push({
    x: Math.random() * 288,
    y: Math.random() * 512,
    size: Math.random() * 2 + 1,
    twinkle: Math.random() * Math.PI
  });
}

// Audio context for dynamic sounds
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type = 'sine') {
  if (!audioCtx) return;
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playHeartbeat() {
  if (!audioCtx) return;
  playTone(60, 0.1, 'sine');
  setTimeout(() => playTone(50, 0.15, 'sine'), 100);
}

function handleInput() {
  initAudio();
  switch (state.curr) {
    case state.getReady:
      if (balance >= betAmount) {
        balance -= betAmount;
        cashedOut = false;
        winAmount = 0;
        canDoubleDown = false;
        state.curr = state.Countdown;
        countdown = 150;
        trajectoryPoints = [];
        particles = [];
        birdTrail = [];
        lastMilestone = 0;
      }
      break;
    case state.Play:
      if (!cashedOut) {
        cashedOut = true;
        winAmount = betAmount * multiplier;
        balance += winAmount;
        stats.wins++;
        stats.streak++;
        stats.totalProfit += winAmount - betAmount;
        if (winAmount > stats.biggestWin) stats.biggestWin = winAmount;
        lastWin = true;
        canDoubleDown = true;
        profitPopup = { show: true, amount: winAmount, y: 160, life: 60 };
        spawnConfetti();
        if (soundEnabled) {
          playTone(1000, 0.1);
          playTone(1200, 0.1);
          playTone(1500, 0.15);
        }
      }
      break;
    case state.gameOver:
      state.curr = state.getReady;
      if (!cashedOut) {
        lastWin = false;
        canDoubleDown = false;
      }
      bird.speed = 0;
      bird.x = scrn.width / 2;
      bird.y = scrn.height - 100;
      pipe.pipes = [];
      UI.score.curr = 0;
      SFX.played = false;
      trajectoryPoints = [];
      particles = [];
      birdTrail = [];
      shakeX = 0; shakeY = 0;
      break;
  }
}

scrn.addEventListener("click", handleInput);
scrn.addEventListener("touchstart", (e) => { e.preventDefault(); handleInput(); });

scrn.onkeydown = function keyDown(e) {
  if (e.keyCode == 32 || e.keyCode == 87) {
    handleInput();
  }
  // M key to toggle sound
  if (e.keyCode == 77) soundEnabled = !soundEnabled;
  // Bet controls (only in getReady state)
  if (state.curr == state.getReady) {
    if (e.keyCode == 37) betAmount = Math.max(10, betAmount - 10); // Left
    if (e.keyCode == 39) betAmount = Math.min(balance, betAmount + 10); // Right
    if (e.keyCode == 40) autoCashOut = Math.max(0, autoCashOut - 0.1); // Down
    if (e.keyCode == 38) autoCashOut = Math.min(5, autoCashOut + 0.1); // Up
  }
};

let frames = 0;
let dx = 2;
let multiplier = 1.00;
let displayMultiplier = 1.00;
let crashPoint = 1.2 + Math.random() * 1.6;
let trajectoryPoints = [];
let particles = [];
let lastHeartbeat = 0;
const state = {
  curr: 0,
  getReady: 0,
  Countdown: 3,
  Play: 1,
  gameOver: 2,
};
const SFX = {
  start: new Audio(),
  flap: new Audio(),
  score: new Audio(),
  hit: new Audio(),
  die: new Audio(),
  played: false,
};
const gnd = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {},
  update: function () {},
};
const bg = {
  sprite: new Image(),
  x: 0,
  y: 0,
  draw: function () {},
};
const pipe = {
  top: { sprite: new Image() },
  bot: { sprite: new Image() },
  gap: 85,
  moved: true,
  pipes: [],
  draw: function () {},
  update: function () {},
};
const bird = {
  animations: [
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
    { sprite: new Image() },
  ],
  rotatation: 0,
  x: 50,
  y: 100,
  speed: 0,
  gravity: 0.125,
  thrust: 3.6,
  frame: 0,
  draw: function () {
    let h = this.animations[this.frame].sprite.height;
    let w = this.animations[this.frame].sprite.width;
    sctx.save();
    sctx.translate(this.x, this.y);
    sctx.rotate(this.rotatation * RAD);
    
    // Pulsing glow at high multipliers
    if (state.curr == state.Play && multiplier > 1.5) {
      let glowIntensity = Math.min((multiplier - 1.5) * 30, 40);
      let pulse = Math.sin(frames * 0.3) * 10;
      let color = multiplier < 2.0 ? "#ffff00" : multiplier < 2.5 ? "#ff8800" : "#ff3366";
      sctx.shadowBlur = glowIntensity + pulse;
      sctx.shadowColor = color;
    }
    
    sctx.drawImage(this.animations[this.frame].sprite, -w / 2, -h / 2);
    sctx.shadowBlur = 0;
    sctx.restore();
  },
  update: function () {
    switch (state.curr) {
      case state.getReady:
        this.rotatation = 0;
        this.x = scrn.width / 2;
        this.y = scrn.height - 100;
        this.frame += frames % 10 == 0 ? 1 : 0;
        trajectoryPoints = [];
        break;
      case state.Countdown:
        this.rotatation = 0;
        this.x = scrn.width / 2;
        this.y = scrn.height - 100;
        this.frame += frames % 10 == 0 ? 1 : 0;
        countdown--;
        // Play beep each second
        if (countdown == 100 || countdown == 50 || countdown == 0) {
          playTone(800, 0.1);
        }
        if (countdown <= 0) {
          state.curr = state.Play;
          multiplier = 1.00;
          displayMultiplier = 1.00;
          crashPoint = 1.2 + Math.random() * 1.6;
          playTone(1200, 0.2);
          SFX.start.play();
        }
        break;
      case state.Play:
        this.frame += frames % 5 == 0 ? 1 : 0;
        multiplier += 0.01;
        displayMultiplier += (multiplier - displayMultiplier) * 0.2;
        
        // Milestone flash at 1.5x, 2x, 2.5x
        let milestones = [1.5, 2.0, 2.5];
        milestones.forEach(m => {
          if (multiplier >= m && lastMilestone < m) {
            milestoneFlash = 15;
            lastMilestone = m;
            if (soundEnabled) playTone(600 + m * 200, 0.15);
          }
        });
        
        // Auto cash out
        if (autoCashOut > 0 && multiplier >= autoCashOut && !cashedOut) {
          cashedOut = true;
          winAmount = betAmount * multiplier;
          balance += winAmount;
          stats.wins++;
          stats.streak++;
          stats.totalProfit += winAmount - betAmount;
          if (winAmount > stats.biggestWin) stats.biggestWin = winAmount;
          profitPopup = { show: true, amount: winAmount, y: 160, life: 60 };
          spawnConfetti();
          if (soundEnabled) {
            playTone(1000, 0.1);
            playTone(1200, 0.1);
            playTone(1500, 0.15);
          }
        }
        
        // Rising tension sound
        if (soundEnabled && frames % 10 == 0) {
          let freq = 200 + (multiplier - 1) * 300;
          playTone(freq, 0.05, 'square');
        }
        
        // Heartbeat at high multipliers
        if (soundEnabled && multiplier > 2.0 && frames - lastHeartbeat > 30) {
          playHeartbeat();
          lastHeartbeat = frames;
        }
        
        this.x = scrn.width / 2;
        let targetY = scrn.height - 100 - (multiplier - 1) * 100;
        this.y += (targetY - this.y) * 0.1; // Smooth easing
        
        // Dynamic rotation based on climb rate
        let climbRate = Math.min((multiplier - 1) * 15, 35);
        this.rotatation = -climbRate;
        
        // Bird trail
        birdTrail.push({ x: this.x, y: this.y, life: 20 });
        if (birdTrail.length > 15) birdTrail.shift();
        
        trajectoryPoints.push({ x: this.x, y: this.y });
        if (trajectoryPoints.length > 150) trajectoryPoints.shift();
        
        if (multiplier >= crashPoint) {
          state.curr = state.gameOver;
          roundHistory.unshift(multiplier);
          if (roundHistory.length > 8) roundHistory.pop();
          if (!cashedOut) {
            stats.losses++;
            stats.streak = 0;
            stats.totalProfit -= betAmount;
          }
          spawnParticles(this.x, this.y);
          shakeX = 10; shakeY = 10;
          if (soundEnabled) SFX.hit.play();
          // Vibrate on mobile
          if (navigator.vibrate) navigator.vibrate(200);
        }
        
        if (this.y < 120) this.y = 120;
        break;
      case state.gameOver:
        this.frame = 1;
        this.rotatation += 15;
        updateParticles();
        shakeX *= 0.9;
        shakeY *= 0.9;
        birdTrail.forEach(t => t.life--);
        birdTrail = birdTrail.filter(t => t.life > 0);
        if (this.y < scrn.height - 50) {
          this.y += 8;
        } else if (!SFX.played) {
          SFX.die.play();
          SFX.played = true;
        }
        break;
    }
    this.frame = this.frame % this.animations.length;
  },
};

const UI = {
  getReady: { sprite: new Image() },
  gameOver: { sprite: new Image() },
  tap: [{ sprite: new Image() }, { sprite: new Image() }],
  score: { curr: 0, best: 0 },
  frame: 0,
  draw: function () {
    // Always draw balance
    sctx.font = "14px Orbitron";
    sctx.fillStyle = "#ffffff";
    sctx.textAlign = "right";
    sctx.fillText("$" + balance.toFixed(0), scrn.width - 10, 20);
    sctx.textAlign = "left";
    
    switch (state.curr) {
      case state.getReady:
        // Bet display
        sctx.font = "18px Orbitron";
        sctx.fillStyle = "#ffff00";
        sctx.shadowBlur = 10;
        sctx.shadowColor = "#ffff00";
        sctx.textAlign = "center";
        sctx.fillText("BET: $" + betAmount, scrn.width / 2, scrn.height / 2 - 30);
        
        // Auto cash out
        sctx.font = "14px Orbitron";
        sctx.fillStyle = autoCashOut > 0 ? "#00ff88" : "#666666";
        sctx.fillText("AUTO: " + (autoCashOut > 0 ? autoCashOut.toFixed(1) + "x" : "OFF"), scrn.width / 2, scrn.height / 2 - 10);
        
        sctx.fillStyle = "#00ff88";
        sctx.shadowColor = "#00ff88";
        sctx.font = "22px Orbitron";
        sctx.fillText("TAP TO START", scrn.width / 2, scrn.height / 2 + 20);
        
        sctx.font = "10px Orbitron";
        sctx.fillStyle = "#888888";
        sctx.shadowBlur = 0;
        sctx.fillText("← → BET | ↑ ↓ AUTO", scrn.width / 2, scrn.height / 2 + 40);
        sctx.textAlign = "left";
        break;
      case state.Countdown:
        let num = Math.ceil(countdown / 50);
        let scale = 1 + (countdown % 50) / 50 * 0.5;
        sctx.font = (80 * scale) + "px Orbitron";
        sctx.fillStyle = "#ffffff";
        sctx.shadowBlur = 30;
        sctx.shadowColor = "#00ff88";
        sctx.textAlign = "center";
        sctx.fillText(num > 0 ? num : "GO!", scrn.width / 2, scrn.height / 2);
        sctx.shadowBlur = 0;
        sctx.textAlign = "left";
        break;
      case state.gameOver:
        sctx.fillStyle = "#ffffff";
        sctx.shadowBlur = 15;
        sctx.shadowColor = "#ffffff";
        sctx.font = "25px Orbitron";
        sctx.textAlign = "center";
        sctx.fillText("TAP TO RESTART", scrn.width / 2, scrn.height / 2 + 70);
        sctx.shadowBlur = 0;
        sctx.textAlign = "left";
        break;
    }
    this.drawScore();
  },
  drawScore: function () {
    switch (state.curr) {
      case state.Play:
        let pulse = 25 + Math.sin(frames * 0.2) * 10;
        let fontSize = 80 + Math.sin(frames * 0.15) * 8;
        
        let color;
        if (multiplier < 1.5) color = "#00ff88";
        else if (multiplier < 2.0) color = "#ffff00";
        else if (multiplier < 2.5) color = "#ff8800";
        else color = "#ff3366";
        
        sctx.shadowBlur = pulse;
        sctx.shadowColor = color;
        sctx.lineWidth = 3;
        sctx.font = fontSize + "px Orbitron";
        sctx.fillStyle = color;
        sctx.textAlign = "center";
        sctx.fillText(displayMultiplier.toFixed(2) + "x", scrn.width / 2, 100);
        sctx.strokeStyle = "#000";
        sctx.strokeText(displayMultiplier.toFixed(2) + "x", scrn.width / 2, 100);
        sctx.shadowBlur = 0;
        
        // Cash out hint
        if (!cashedOut) {
          sctx.font = "16px Orbitron";
          sctx.fillStyle = "#00ff88";
          sctx.shadowBlur = 10;
          sctx.shadowColor = "#00ff88";
          sctx.fillText("TAP TO CASH OUT", scrn.width / 2, 130);
          sctx.font = "14px Orbitron";
          sctx.fillStyle = "#ffff00";
          sctx.fillText("$" + (betAmount * displayMultiplier).toFixed(2), scrn.width / 2, 150);
        } else {
          sctx.font = "20px Orbitron";
          sctx.fillStyle = "#00ff88";
          sctx.shadowBlur = 15;
          sctx.shadowColor = "#00ff88";
          sctx.fillText("CASHED OUT!", scrn.width / 2, 130);
          sctx.fillText("+$" + winAmount.toFixed(2), scrn.width / 2, 155);
        }
        sctx.shadowBlur = 0;
        sctx.textAlign = "left";
        break;
      case state.gameOver:
        sctx.font = "40px Orbitron";
        sctx.textAlign = "center";
        if (cashedOut) {
          sctx.fillStyle = "#00ff88";
          sctx.shadowBlur = 25;
          sctx.shadowColor = "#00ff88";
          sctx.fillText("WIN!", scrn.width / 2, scrn.height / 2 - 30);
          sctx.font = "30px Orbitron";
          sctx.fillText("+$" + winAmount.toFixed(2), scrn.width / 2, scrn.height / 2 + 10);
        } else {
          sctx.fillStyle = "#ff3366";
          sctx.shadowBlur = 25;
          sctx.shadowColor = "#ff3366";
          sctx.fillText("CRASHED!", scrn.width / 2, scrn.height / 2 - 30);
          sctx.font = "30px Orbitron";
          sctx.fillText("-$" + betAmount, scrn.width / 2, scrn.height / 2 + 10);
        }
        sctx.font = "25px Orbitron";
        sctx.fillStyle = "#ffffff";
        sctx.shadowColor = "#ffffff";
        sctx.fillText(multiplier.toFixed(2) + "x", scrn.width / 2, scrn.height / 2 + 45);
        sctx.shadowBlur = 0;
        sctx.textAlign = "left";
        break;
    }
  },
  update: function () {
    if (state.curr == state.Play) return;
    this.frame += frames % 10 == 0 ? 1 : 0;
    this.frame = this.frame % this.tap.length;
  },
};

function onAssetLoad() { assetsLoaded++; }
bird.animations[0].sprite.onload = onAssetLoad;
bird.animations[1].sprite.onload = onAssetLoad;
bird.animations[2].sprite.onload = onAssetLoad;

gnd.sprite.src = "img/ground.png";
bg.sprite.src = "img/BG.png";
pipe.top.sprite.src = "img/toppipe.png";
pipe.bot.sprite.src = "img/botpipe.png";
UI.gameOver.sprite.src = "img/go.png";
UI.getReady.sprite.src = "img/getready.png";
UI.tap[0].sprite.src = "img/tap/t0.png";
UI.tap[1].sprite.src = "img/tap/t1.png";
bird.animations[0].sprite.src = "img/bird/b0.png";
bird.animations[1].sprite.src = "img/bird/b1.png";
bird.animations[2].sprite.src = "img/bird/b2.png";
bird.animations[3].sprite.src = "img/bird/b0.png";
SFX.start.src = "sfx/start.wav";
SFX.flap.src = "sfx/flap.wav";
SFX.score.src = "sfx/score.wav";
SFX.hit.src = "sfx/hit.wav";
SFX.die.src = "sfx/die.wav";

function gameLoop() {
  update();
  draw();
  frames++;
}

function update() {
  bird.update();
  UI.update();
}

function draw() {
  sctx.save();
  
  // Loading screen
  if (drawLoading()) {
    sctx.restore();
    return;
  }
  
  sctx.translate(
    (Math.random() - 0.5) * shakeX,
    (Math.random() - 0.5) * shakeY
  );
  
  // Dark casino background with stars
  let gradient = sctx.createLinearGradient(0, 0, 0, scrn.height);
  gradient.addColorStop(0, "#0a0e27");
  gradient.addColorStop(1, "#1a1f3a");
  sctx.fillStyle = gradient;
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  
  // Draw stars
  drawStars();
  
  // Draw grid
  drawGrid();
  
  // Draw round history
  drawRoundHistory();
  
  // Draw logo
  drawLogo();
  
  if (state.curr == state.Play || state.curr == state.gameOver) {
    drawTrajectory();
  }
  
  drawSpeedLines();
  drawParticles();
  drawBirdTrail();
  updateConfetti();
  drawConfetti();
  drawMilestoneFlash();
  drawProfitPopup();
  bg.draw();
  bird.draw();
  UI.draw();
  drawStats();
  drawSoundToggle();
  
  sctx.restore();
}

setInterval(gameLoop, 20);

function drawStars() {
  stars.forEach(s => {
    let twinkle = 0.5 + Math.sin(frames * 0.05 + s.twinkle) * 0.5;
    sctx.beginPath();
    sctx.arc(s.x, s.y, s.size * twinkle, 0, Math.PI * 2);
    sctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`;
    sctx.fill();
  });
}

function drawLogo() {
  if (state.curr == state.Play || state.curr == state.Countdown) return;
  
  // Main title
  sctx.font = "900 32px Orbitron";
  sctx.textAlign = "center";
  sctx.fillStyle = "#ff3366";
  sctx.shadowBlur = 20;
  sctx.shadowColor = "#ff3366";
  sctx.fillText("FLAPPY", scrn.width / 2, 60);
  
  sctx.fillStyle = "#00ff88";
  sctx.shadowColor = "#00ff88";
  sctx.fillText("AVIATOR", scrn.width / 2, 95);
  
  // Subtitle
  sctx.font = "14px Russo One";
  sctx.fillStyle = "#ffffff";
  sctx.shadowBlur = 10;
  sctx.shadowColor = "#ffffff";
  sctx.globalAlpha = 0.7;
  sctx.fillText("CRASH GAME", scrn.width / 2, 115);
  sctx.globalAlpha = 1;
  sctx.shadowBlur = 0;
  sctx.textAlign = "left";
}

function drawGrid() {
  sctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  sctx.lineWidth = 1;
  for (let x = 0; x < scrn.width; x += 30) {
    sctx.beginPath();
    sctx.moveTo(x, 0);
    sctx.lineTo(x, scrn.height);
    sctx.stroke();
  }
  for (let y = 0; y < scrn.height; y += 30) {
    sctx.beginPath();
    sctx.moveTo(0, y);
    sctx.lineTo(scrn.width, y);
    sctx.stroke();
  }
}

function drawRoundHistory() {
  if (roundHistory.length === 0) return;
  
  sctx.font = "12px Orbitron";
  sctx.textAlign = "center";
  
  let startX = 20;
  roundHistory.forEach((mult, i) => {
    let color = mult < 1.5 ? "#00ff88" : mult < 2.0 ? "#ffff00" : mult < 2.5 ? "#ff8800" : "#ff3366";
    sctx.fillStyle = color;
    sctx.shadowBlur = 5;
    sctx.shadowColor = color;
    sctx.fillText(mult.toFixed(2) + "x", startX + i * 34, 20);
  });
  sctx.shadowBlur = 0;
  sctx.textAlign = "left";
}

function drawBirdTrail() {
  birdTrail.forEach((t, i) => {
    let alpha = t.life / 20;
    let color;
    if (multiplier < 1.5) color = `rgba(0, 255, 136, ${alpha * 0.5})`;
    else if (multiplier < 2.0) color = `rgba(255, 255, 0, ${alpha * 0.5})`;
    else if (multiplier < 2.5) color = `rgba(255, 136, 0, ${alpha * 0.5})`;
    else color = `rgba(255, 51, 102, ${alpha * 0.5})`;
    
    sctx.beginPath();
    sctx.arc(t.x, t.y, 10 * alpha, 0, Math.PI * 2);
    sctx.fillStyle = color;
    sctx.shadowBlur = 15;
    sctx.shadowColor = color;
    sctx.fill();
  });
  sctx.shadowBlur = 0;
}

function drawSpeedLines() {
  if (state.curr != state.Play) return;
  let intensity = Math.min((multiplier - 1) * 0.5, 1);
  sctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.3})`;
  sctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    let y = (frames * 3 + i * 60) % scrn.height;
    let len = 20 + intensity * 40;
    sctx.beginPath();
    sctx.moveTo(scrn.width - 20, y);
    sctx.lineTo(scrn.width - 20 - len, y);
    sctx.stroke();
  }
}

function drawMilestoneFlash() {
  if (milestoneFlash > 0) {
    sctx.fillStyle = `rgba(255, 255, 255, ${milestoneFlash / 20})`;
    sctx.fillRect(0, 0, scrn.width, scrn.height);
    milestoneFlash--;
  }
}

function spawnConfetti() {
  for (let i = 0; i < 50; i++) {
    confetti.push({
      x: scrn.width / 2,
      y: scrn.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 10 - 5,
      size: 3 + Math.random() * 5,
      color: ["#ff3366", "#00ff88", "#ffff00", "#00aaff", "#ff8800"][Math.floor(Math.random() * 5)],
      life: 100
    });
  }
}

function updateConfetti() {
  confetti.forEach(c => {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.3;
    c.life--;
  });
  confetti = confetti.filter(c => c.life > 0);
}

function drawConfetti() {
  confetti.forEach(c => {
    sctx.fillStyle = c.color;
    sctx.globalAlpha = c.life / 100;
    sctx.fillRect(c.x, c.y, c.size, c.size);
  });
  sctx.globalAlpha = 1;
}

function drawStats() {
  if (state.curr != state.getReady) return;
  sctx.font = "10px Orbitron";
  sctx.fillStyle = "#888888";
  sctx.textAlign = "left";
  let winRate = stats.wins + stats.losses > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0) : 0;
  sctx.fillText(`W:${stats.wins} L:${stats.losses} (${winRate}%)`, 10, scrn.height - 30);
  let streakText = stats.streak > 0 ? ` | 🔥${stats.streak}` : "";
  sctx.fillText(`Best: $${stats.biggestWin.toFixed(0)} | P/L: $${stats.totalProfit.toFixed(0)}${streakText}`, 10, scrn.height - 15);
}

function drawSoundToggle() {
  sctx.font = "16px Orbitron";
  sctx.fillStyle = soundEnabled ? "#00ff88" : "#ff3366";
  sctx.textAlign = "right";
  sctx.fillText(soundEnabled ? "🔊" : "🔇", scrn.width - 10, scrn.height - 10);
}

function drawLoading() {
  if (assetsLoaded >= 3) return false;
  sctx.fillStyle = "#0a0e27";
  sctx.fillRect(0, 0, scrn.width, scrn.height);
  sctx.font = "20px Orbitron";
  sctx.fillStyle = "#00ff88";
  sctx.textAlign = "center";
  sctx.fillText("LOADING...", scrn.width / 2, scrn.height / 2);
  sctx.fillStyle = "#333";
  sctx.fillRect(50, scrn.height / 2 + 20, scrn.width - 100, 10);
  sctx.fillStyle = "#00ff88";
  sctx.fillRect(50, scrn.height / 2 + 20, (scrn.width - 100) * (assetsLoaded / 3), 10);
  return true;
}

function drawProfitPopup() {
  if (!profitPopup.show) return;
  profitPopup.life--;
  profitPopup.y -= 1;
  if (profitPopup.life <= 0) { profitPopup.show = false; return; }
  let alpha = profitPopup.life / 60;
  sctx.font = "bold 24px Orbitron";
  sctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
  sctx.shadowBlur = 15;
  sctx.shadowColor = "#00ff88";
  sctx.textAlign = "center";
  sctx.fillText("+$" + profitPopup.amount.toFixed(0), scrn.width / 2, profitPopup.y);
  sctx.shadowBlur = 0;
}

function drawTrajectory() {
  if (multiplier <= 1) return;
  
  let color;
  if (multiplier < 1.5) color = "#00ff88";
  else if (multiplier < 2.0) color = "#ffff00";
  else if (multiplier < 2.5) color = "#ff8800";
  else color = "#ff3366";
  
  sctx.beginPath();
  sctx.strokeStyle = color;
  sctx.lineWidth = 4;
  sctx.shadowBlur = 15;
  sctx.shadowColor = color;
  
  let startX = 50;
  let startY = scrn.height - 100;
  sctx.moveTo(startX, startY);
  
  let endX = bird.x;
  let endY = bird.y;
  let controlX = startX + (endX - startX) * 0.8;
  let controlY = startY;
  
  sctx.quadraticCurveTo(controlX, controlY, endX, endY);
  sctx.stroke();
  sctx.shadowBlur = 0;
}

function spawnParticles(x, y) {
  // Main explosion
  for (let i = 0; i < 60; i++) {
    let speed = 3 + Math.random() * 15;
    let angle = Math.random() * Math.PI * 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 8,
      life: 50 + Math.random() * 50,
      maxLife: 50 + Math.random() * 50,
      color: ["#ff3366", "#ffaa00", "#ff6600", "#ffff00", "#ff0000"][Math.floor(Math.random() * 5)],
      type: "circle"
    });
  }
  // Sparks
  for (let i = 0; i < 20; i++) {
    let speed = 5 + Math.random() * 10;
    let angle = Math.random() * Math.PI * 2;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2,
      life: 20 + Math.random() * 20,
      maxLife: 20 + Math.random() * 20,
      color: "#ffffff",
      type: "spark"
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4;
    p.vx *= 0.98;
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  particles.forEach(p => {
    let alpha = p.life / p.maxLife;
    sctx.beginPath();
    sctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    sctx.fillStyle = p.color;
    sctx.globalAlpha = alpha;
    sctx.shadowBlur = 10;
    sctx.shadowColor = p.color;
    sctx.fill();
  });
  sctx.globalAlpha = 1;
  sctx.shadowBlur = 0;
}
