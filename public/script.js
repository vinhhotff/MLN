const socket = io();

// Constants
const spaces = [
    { name: "TRẢ LƯƠNG", type: "start", info: "Lãnh 2 Tr" }, // 0
    { name: "Sàn Shopee", type: "prop", price: 10, rent: 4, color: "#ff4d4d", info: "Linh hồn e-commerce" },
    { name: "Thuế CĐR", type: "tax", rent: 5, color: "#555", info: "Thuế cố định" },
    { name: "BẪY CHI PHÍ", type: "trap", amount: 6, color: "#d90429", info: "Lỗ nặng" },
    { name: "Shopee Express", type: "prop", price: 12, rent: 5, color: "#ff4d4d", info: "Ship hỏa tốc" },
    { name: "Thẻ Cơ Hội", type: "chance", color: "#8338ec", info: "Hên xui" },
    { name: "Shopee Mall", type: "prop", price: 15, rent: 8, color: "#ff4d4d", info: "Hàng chính hãng" },
    { name: "SỞ CẢNH SÁT", type: "jail", color: "#1d3557", info: "Nơi tạm giam" },
    { name: "GrabBike", type: "prop", price: 15, rent: 8, color: "#06d6a0", info: "Xe ôm công nghệ" },
    { name: "Thẻ Cơ Hội", type: "chance", color: "#8338ec" },
    { name: "TRẠM PHÍ", type: "fee", amount: 6, color: "#3a0ca3", info: "Phí cầu đường" },
    { name: "GrabFood", type: "prop", price: 18, rent: 10, color: "#06d6a0", info: "Ship đồ ăn" },
    { name: "Mạng FPT", type: "prop", price: 16, rent: 8, color: "#4361ee", info: "Internet cáp quang" },
    { name: "GrabCar", type: "prop", price: 20, rent: 12, color: "#06d6a0", info: "Taxi hạng sang" },
    { name: "BÃI ĐỖ XE", type: "parking", color: "#2b2d42", info: "Miễn phí" },
    { name: "Kênh TikTok", type: "prop", price: 22, rent: 14, color: "#000", info: "Kênh 1M Follower" },
    { name: "Thẻ Cơ Hội", type: "chance", color: "#8338ec" },
    { name: "BẪY QUẢNG CÁO", type: "trap", amount: 10, color: "#d90429", info: "Click tặc" },
    { name: "TikTok Live", type: "prop", price: 25, rent: 16, color: "#000", info: "Nghìn đơn mỗi tối" },
    { name: "Chống Độc Quyền", type: "tax", rent: 12, color: "#555", info: "Ủy ban cạnh tranh" },
    { name: "TikTok Shop", type: "prop", price: 28, rent: 18, color: "#000", info: "Hệ sinh thái TikTok" },
    { name: "BỊ ĐIỀU TRA!", type: "gotojail", color: "#d90429", info: "Mất 1 lượt" },
    { name: "BeBike", type: "prop", price: 30, rent: 20, color: "#ffd166", info: "Áo vàng rực rỡ" },
    { name: "Thẻ Cơ Hội", type: "chance", color: "#8338ec" },
    { name: "PHÍ HỆ THỐNG", type: "fee", amount: 15, color: "#3a0ca3", info: "Server AWS" },
    { name: "BeCar", type: "prop", price: 35, rent: 25, color: "#ffd166", info: "Chạy app Be" },
    { name: "Mạng Viettel", type: "prop", price: 20, rent: 10, color: "#4361ee", info: "Hạ tầng 5G" },
    { name: "BeFood", type: "prop", price: 40, rent: 30, color: "#ffd166", info: "Ăn gì cũng rẻ" }
];

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const boardDiv = document.getElementById('board');
const joinBtn = document.getElementById('joinBtn');
const nameInput = document.getElementById('playerName');
const teamBtns = document.querySelectorAll('.team-btn');
const playersListDiv = document.getElementById('players-list');
const turnIndicator = document.getElementById('turn-indicator');
const chatMsgs = document.getElementById('chat-messages');

const rollBtn = document.getElementById('rollBtn');
const buyBtn = document.getElementById('buyBtn');
const upgradeBtn = document.getElementById('upgradeBtn');
const chanceBtn = document.getElementById('chanceBtn');
const takeoverBtn = document.getElementById('takeoverBtn');
const endBtn = document.getElementById('endBtn');
const diceResult = document.getElementById('dice-result');
const diceIcon = document.getElementById('dice-icon');
const workBtn = document.getElementById('workBtn');
const testBankruptBtn = document.getElementById('testBankruptBtn');
const diceOverlay = document.getElementById('dice-overlay');
const diceBox2d = document.getElementById('dice-box-2d');
const dicePips = document.getElementById('dice-pips');
const chanceOverlay = document.getElementById('chance-overlay');
const chanceCardInner = document.getElementById('chance-card-inner');
const chanceIconBack = document.getElementById('chance-icon-back');
const chanceTitleBack = document.getElementById('chance-title-back');
const chanceInfoBack = document.getElementById('chance-info-back');

let myTeam = null;
let playerName = "";
let currentGameState = null;
let pendingChanceResult = null;
let teamTokens = {}; // Store persistent tokens
let resizeTimeout = null;
let isRolling = false; // Lock UI updates during dice animation
let isSpectator = false;

const spectateBtn = document.getElementById('spectateBtn');
const resetGameBtn = document.getElementById('resetGameBtn');
const spectatorControls = document.getElementById('spectator-controls');

// Handle window resize to reposition tokens
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (currentGameState) updateUI();
    }, 100);
});

// Initialize Board
function createBoard() {
    spaces.forEach((space, i) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `c${i}`;
        cell.dataset.type = space.type;

        let content = '';
        if (space.type === 'prop') {
            content = `
                <div class="cell-header" style="background:${space.color}">${space.name}</div>
                <div class="cell-content">
                    <div class="cell-price">Mua: ${space.price}M</div>
                    <div class="cell-rent">Thu: ${space.rent}M</div>
                </div>
            `;
        } else {
            content = `
                <div class="cell-title">${space.name}</div>
                <div class="cell-info">${space.info || ''}</div>
            `;
        }

        content += `<div class="owner-bar" id="own-${i}"></div><div class="token-container" id="tc-${i}"></div>`;
        content += `<button class="sell-prop-btn" id="sell-${i}" style="display:none;">BÁN 70%</button>`;
        cell.innerHTML = content;

        // Add click listener for sell button
        const sellBtn = cell.querySelector('.sell-prop-btn');
        if (sellBtn) {
            sellBtn.onclick = (e) => {
                e.stopPropagation();
                Swal.fire({
                    title: 'Bán tài sản?',
                    text: `Bạn muốn thanh lý tài sản này với giá 70% (${Math.floor(space.price * 0.7)}M)?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d90429',
                    confirmButtonText: 'Đồng ý bán!'
                }).then((result) => {
                    if (result.isConfirmed) {
                        socket.emit('sellProperty', i);
                    }
                });
            };
        }

        boardDiv.appendChild(cell);
    });
}
createBoard();

// Login
teamBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        teamBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        myTeam = btn.dataset.team;
        joinBtn.disabled = false;
    });
});

joinBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim() || 'Thành viên ẩn danh';
    socket.emit('joinTeam', myTeam, playerName);
    joinBtn.disabled = true;
    joinBtn.textContent = 'Đang tham gia...';
});

spectateBtn.addEventListener('click', () => {
    playerName = nameInput.value.trim() || 'Khán giả';
    socket.emit('joinSpectator', playerName);
    spectateBtn.disabled = true;
});

resetGameBtn.addEventListener('click', () => {
    Swal.fire({
        title: 'Xác nhận Reset?',
        text: 'Toàn bộ ván đấu sẽ bị hủy và bắt đầu lại từ đầu!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d90429'
    }).then(res => {
        if (res.isConfirmed) {
            socket.emit('resetGame');
        }
    });
});

testBankruptBtn.addEventListener('click', () => {
    Swal.fire({
        title: 'Bạn chắc chứ?',
        text: 'Hành động này sẽ khiến tập đoàn của bạn phá sản ngay lập tức!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d90429',
        confirmButtonText: 'Tôi muốn phá sản!'
    }).then(res => {
        if (res.isConfirmed) {
            socket.emit('debugBankruptcy');
        }
    });
});

socket.on('errorMsg', (msg) => {
    Swal.fire('Thất bại', msg, 'error');
    joinBtn.disabled = false;
    joinBtn.textContent = 'Tham Gia Thị Trường';
});

socket.on('joinSuccess', () => {
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
});

socket.on('spectatorJoinSuccess', () => {
    isSpectator = true;
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
    spectatorControls.style.display = 'block';
});

socket.on('gameReset', () => {
    window.location.reload();
});

// Controls
rollBtn.addEventListener('click', () => {
    socket.emit('rollDice');
    rollBtn.disabled = true;
});

buyBtn.addEventListener('click', () => {
    const team = currentGameState.teams[myTeam];
    const pos = team.position;
    socket.emit('buyProperty', pos);
    buyBtn.disabled = true;
    buyBtn.style.display = 'none';
    Swal.fire({
        toast: true,
        position: 'center',
        icon: 'success',
        title: 'Đầu tư thành công!',
        showConfirmButton: false,
        timer: 1500
    });
});

upgradeBtn.addEventListener('click', () => {
    const team = currentGameState.teams[myTeam];
    const pos = team.position;
    socket.emit('upgradeProperty', pos);
    upgradeBtn.disabled = true;
    upgradeBtn.style.display = 'none';
    Swal.fire({
        toast: true,
        position: 'center',
        icon: 'success',
        title: 'Nâng cấp Độc quyền thành công!',
        showConfirmButton: false,
        timer: 1500
    });
});

chanceBtn.addEventListener('click', () => {
    socket.emit('triggerChance');
    chanceBtn.style.display = 'none';
});

// Flip Chance Card and close after summary
chanceCardInner.addEventListener('click', () => {
    if (!chanceCardInner.classList.contains('flipped')) {
        chanceCardInner.classList.add('flipped');

        // Let user see the flipped card for a bit then show Swal and hide overlay
        setTimeout(() => {
            if (pendingChanceResult) {
                const data = pendingChanceResult;
                Swal.fire({
                    title: data.chance.title,
                    text: data.chance.info,
                    icon: data.chance.amount > 0 ? 'success' : 'error',
                    confirmButtonColor: '#2a9d8f'
                }).then(() => {
                    chanceOverlay.style.display = 'none';
                    chanceCardInner.classList.remove('flipped');
                    endBtn.disabled = false;
                });
                pendingChanceResult = null;
            }
        }, 2000); // 2s is enough to read the flipped card value
    }
});

takeoverBtn.addEventListener('click', () => {
    const team = currentGameState.teams[myTeam];
    const pos = team.position;
    const originalPrice = spaces[pos].price;
    const takeoverPrice = originalPrice * 2;

    Swal.fire({
        title: 'Thâu tóm tài sản?',
        text: `Bạn muốn chi ${takeoverPrice}M (x2 giá gốc) để thâu tóm ô này từ đối phương?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d90429',
        confirmButtonText: 'Đồng ý thâu tóm!'
    }).then((result) => {
        if (result.isConfirmed) {
            socket.emit('takeoverProperty', pos);
            takeoverBtn.style.display = 'none';
        }
    });
});

endBtn.addEventListener('click', () => {
    socket.emit('endTurn');
    endBtn.disabled = true;
    buyBtn.disabled = true;
    buyBtn.style.display = '';
    upgradeBtn.disabled = true;
    upgradeBtn.style.display = 'none';
    chanceBtn.style.display = 'none';
    rollBtn.disabled = true;
});

// Tính năng Cày OT (Gig economy)
workBtn.addEventListener('click', () => {
    if (currentGameState && currentGameState.teams[myTeam] && currentGameState.teams[myTeam].bankrupt) {
        Swal.fire('Phá sản', 'Tập đoàn đã phá sản, bạn đã bị sa thải!', 'error');
        return;
    }
    socket.emit('workGig');
});

socket.on('workedSuccess', (earned, cooldownSecs) => {
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: `+${earned}M tiền làm thêm!`,
        showConfirmButton: false,
        timer: 1500
    });

    // Khóa nút tạo cooldown cá nhân
    workBtn.disabled = true;
    workBtn.style.opacity = '0.5';
    let secs = cooldownSecs;
    workBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> Hồi sức (${secs}s)`;

    const interval = setInterval(() => {
        secs--;
        if (secs <= 0) {
            clearInterval(interval);
            workBtn.disabled = false;
            workBtn.style.opacity = '1';
            workBtn.innerHTML = `<i class="fas fa-laptop-code"></i> Cày OT (Tăng Quỹ Team)`;
        } else {
            workBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> Hồi sức (${secs}s)`;
        }
    }, 1000);
});



function addChat(text) {
    const m = document.createElement('div');
    m.className = 'chat-msg';
    m.innerHTML = text;
    chatMsgs.appendChild(m);
    chatMsgs.parentElement.scrollTop = chatMsgs.parentElement.scrollHeight;
}

// Socket Events
socket.on('connect', () => { console.log("Connected"); });

socket.on('actionLog', (msg) => { addChat(msg); });
socket.on('chatMessage', (msg) => { addChat(msg); });

socket.on('countdownUpdate', (seconds) => {
    const display = document.getElementById('countdown-display');
    const timer = document.getElementById('timer-sec');
    if (display && timer) {
        display.style.display = 'block';
        timer.textContent = seconds;
    }
});

// 2D Dice elements
const pipPositions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
};

function drawPips(value) {
    if (!dicePips || !pipPositions[value]) return;
    dicePips.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const pip = document.createElement('div');
        if (pipPositions[value].includes(i)) {
            pip.className = 'pip';
        }
        dicePips.appendChild(pip);
    }
}

socket.on('diceRolled', (data) => {
    try {
        const { teamId, dice, newPos, msgStart } = data;
        const teamName = currentGameState.teams[teamId].name;

        isRolling = true;
        rollBtn.disabled = true; // Disable immediately for everyone

        // Hide old result
        document.getElementById('dice-result-container').style.display = 'none';

        // Show 2D Dice Overlay
        diceOverlay.style.display = 'flex';
        diceBox2d.classList.add('rolling');

        // Fake rolling animation pips
        let rollInterval = setInterval(() => {
            const fakeVal = Math.floor(Math.random() * 6) + 1;
            drawPips(fakeVal);
        }, 100);

        setTimeout(() => {
            clearInterval(rollInterval);
            diceBox2d.classList.remove('rolling');
            drawPips(dice);

            // Show result text with small delay
            setTimeout(() => {
                diceOverlay.style.display = 'none';
                diceResult.textContent = dice;
                document.getElementById('dice-result-container').style.display = 'block';

                addChat(`🎲 <b>${teamName}</b> tung được <b>${dice}</b>. ${msgStart}`);

                isRolling = false; // Allow UI updates now

                if (teamId === myTeam) {
                    handlePostRoll(newPos);
                }
            }, 800);
        }, 1500);
    } catch (err) {
        console.error("Dice roll error:", err);
        isRolling = false;
        if (diceOverlay) diceOverlay.style.display = 'none';
    }
});

socket.on('chancePulled', (data) => {
    if (data.teamId === myTeam) {
        // Setup card content
        chanceTitleBack.textContent = data.chance.title;
        chanceInfoBack.textContent = data.chance.info;
        chanceIconBack.className = `fas ${data.chance.amount > 0 ? 'fa-gift' : 'fa-skull-crossbones'} card-icon`;

        // Show overlay with animation
        pendingChanceResult = data;
        chanceOverlay.style.display = 'flex';
        chanceCardInner.classList.remove('flipped');
    }
});

socket.on('globalEvent', (ev) => {
    Swal.fire({
        title: "🌍 SỰ KIỆN TOÀN CẦU",
        text: ev.desc,
        icon: 'info',
        confirmButtonColor: '#e63946'
    });
});

socket.on('propertyBought', (data) => {
    const { teamId, index, type } = data;
    const cell = document.getElementById(`c${index}`);
    const team = currentGameState.teams[teamId];
    if (!cell || !team) return;

    // Flash Effect
    cell.classList.add('purchase-flash');
    setTimeout(() => cell.classList.remove('purchase-flash'), 1000);

    // Stamp Effect
    const stamp = document.createElement('div');
    stamp.className = 'property-stamp stamped';
    stamp.innerHTML = `<i class="fas ${team.icon}"></i> ${type === 'takeover' ? '⚔️ ACQUIRED' : '💼 SOLD'}`;
    stamp.style.color = team.color;
    cell.appendChild(stamp);
    setTimeout(() => stamp.remove(), 1600);
});

socket.on('propertyUpgraded', (data) => {
    const { teamId, index } = data;
    const cell = document.getElementById(`c${index}`);
    const team = currentGameState.teams[teamId];
    if (!cell || !team) return;

    // Upgrade Flash Effect
    cell.classList.add('upgrade-flash');
    setTimeout(() => cell.classList.remove('upgrade-flash'), 1200);

    // Upgrade Stamp
    const stamp = document.createElement('div');
    stamp.className = 'property-stamp stamped';
    stamp.innerHTML = `<i class="fas fa-crown"></i> MONOPOLY`;
    stamp.style.color = '#ffd166';
    cell.appendChild(stamp);
    setTimeout(() => stamp.remove(), 1600);
});

socket.on('gameOver', (data) => {
    Swal.fire({
        title: "GAME OVER!",
        html: `Tập đoàn <b>${data.winner.name}</b> đã thắng tuyệt đối và thâu tóm toàn bộ thị trường!`,
        icon: 'success',
        confirmButtonText: 'Tái cấu trúc (Reload)',
    }).then(() => {
        window.location.reload();
    });
});

function handlePostRoll(pos) {
    const team = currentGameState.teams[myTeam];
    const space = spaces[pos];

    addChat(`📍 Tập đoàn đi đến: <b style="color:${space.color || '#ffd166'}">${space.name}</b>`);

    // Reset buttons
    buyBtn.style.display = 'none';
    upgradeBtn.style.display = 'none';
    takeoverBtn.style.display = 'none';
    chanceBtn.style.display = 'none';
    endBtn.disabled = false;

    if (space.type === 'prop') {
        const ownerObj = currentGameState.boardState[pos];

        if (ownerObj === null && team.money >= space.price) {
            buyBtn.style.display = 'inline-block';
            buyBtn.disabled = false;
        } else if (ownerObj && ownerObj.owner === myTeam && ownerObj.level === 1 && team.money >= space.price) {
            upgradeBtn.style.display = 'inline-block';
            upgradeBtn.disabled = false;
        } else if (ownerObj && ownerObj.owner !== myTeam) {
            const actualRent = ownerObj.level === 2 ? space.rent * 3 : space.rent;
            socket.emit('payRent', pos);
            document.body.classList.add('shake-danger');
            setTimeout(() => document.body.classList.remove('shake-danger'), 500);
            Swal.fire({ title: 'Bị Bóc Lột!', html: `Bạn dẫm vào thị phần của <b>${currentGameState.teams[ownerObj.owner].name}</b>. Bị ép trả <b style="color:#d90429">${actualRent}Tr</b> tiền dịch vụ!`, icon: 'error', confirmButtonColor: '#d90429' });

            // Chỉ cho thâu tóm nếu tài sản CHƯA được nâng cấp Độc quyền (level < 2)
            if (ownerObj.level < 2 && team.money >= space.price * 2) {
                takeoverBtn.style.display = 'inline-block';
                takeoverBtn.disabled = false;
            }
        }
    } else if (space.type === 'tax') {
        socket.emit('payTax', space.rent, space.info);
        document.body.classList.add('shake-danger');
        setTimeout(() => document.body.classList.remove('shake-danger'), 500);
        Swal.fire({ title: 'Đóng Thuế', text: `${space.name}: ${space.info}`, icon: 'info', confirmButtonColor: '#fca311' });
    } else if (space.type === 'trap') {
        socket.emit('payTax', space.amount, space.info);
        document.body.classList.add('shake-danger');
        setTimeout(() => document.body.classList.remove('shake-danger'), 500);
        Swal.fire({ title: '💀 SẬP BẪY!', text: `${space.name}: ${space.info}`, icon: 'error', confirmButtonColor: '#d90429' });
    } else if (space.type === 'fee') {
        socket.emit('payTax', space.amount, space.info);
        document.body.classList.add('shake-danger');
        setTimeout(() => document.body.classList.remove('shake-danger'), 500);
        Swal.fire({ title: '⛽ TRẠM PHÍ', text: `${space.name}: ${space.info}`, icon: 'warning', confirmButtonColor: '#3a0ca3' });
    } else if (space.type === 'chance') {
        chanceBtn.style.display = 'block';
        chanceBtn.disabled = false;
        endBtn.disabled = true; // Force pick chance
    } else if (space.type === 'gotojail') {
        Swal.fire('Cảnh Cáo', 'Lạm dụng độc quyền, bị phạt nhắc nhở!', 'warning');
    }
}

function updateUI() {
    if (!currentGameState) return;
    const { teams, teamOrder, turn, boardState, memberCounts, gameStarted, countdownTimer } = currentGameState;

    const countdownDisplay = document.getElementById('countdown-display');
    const timerSec = document.getElementById('timer-sec');
    if (gameStarted) {
        if (countdownDisplay) countdownDisplay.style.display = 'none';
    } else {
        if (countdownDisplay && countdownTimer < 60) {
            countdownDisplay.style.display = 'block';
            if (timerSec) timerSec.textContent = countdownTimer;
        }
    }

    // Clear ownership banners
    for (let i = 0; i < 28; i++) {
        const own = document.getElementById(`own-${i}`);
        if (own) {
            own.style.background = 'transparent';
            own.innerHTML = '';
        }
    }

    let cellOccupants = {};
    for (let i = 0; i < 28; i++) cellOccupants[i] = 0;

    // Teams List & Tokens
    playersListDiv.innerHTML = gameStarted ? '<h3>Thị Trường (Đang Hoạt Động)</h3>' : '<h3>Thị Trường (Đang Chờ...)</h3>';

    // Show all teams initially, but highlight only active ones if game started
    const teamsToDisplay = gameStarted ? teamOrder : Object.keys(teams);

    teamsToDisplay.forEach(id => {
        const t = teams[id];
        const count = memberCounts[id] || 0;

        // Skip teams with 0 players if game started but they are not in teamOrder
        if (gameStarted && !teamOrder.includes(id)) return;
        if (!gameStarted && count === 0) {
            // Maybe show them anyway in lobby? Yes, it helps people choose.
        }

        const card = document.createElement('div');
        let cardClass = `team-card ${id === turn ? 'active' : ''} ${t.bankrupt ? 'bankrupt-card' : ''}`;

        card.className = cardClass;
        card.style.borderLeftColor = t.bankrupt ? '#555' : t.color;

        let bankruptLabel = t.bankrupt ? '<span style="color:#d90429; font-weight:bold; font-size:1rem;">(PHÁ SẢN)</span>' : '';

        card.innerHTML = `
            <div class="info" style="${t.bankrupt ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                <h4><i class="fas ${t.icon}"></i> ${t.name} ${id === myTeam ? '<span style="color:#ffd166; font-size:0.8rem; margin-left:5px;">(Bạn)</span>' : ''}</h4>
                <div class="members"><i class="fas fa-users"></i> ${count} thành viên</div>
            </div>
            <div class="money">${bankruptLabel} ${t.bankrupt ? '' : t.money + 'M'}</div>
        `;
        playersListDiv.appendChild(card);

        // Token - Only show if team has members and is not bankrupt
        if (!t.bankrupt && count > 0) {
            let token = teamTokens[id];
            if (!token) {
                token = document.createElement('div');
                token.className = 'token';
                token.id = 'token-' + id;
                token.style.background = t.color;
                token.style.color = '#fff';
                token.innerHTML = `<i class="fas ${t.icon}" style="font-size:10px;"></i>`;
                boardDiv.appendChild(token);
                teamTokens[id] = token;
            }

            const cell = document.getElementById(`c${t.position}`);
            if (cell) {
                const existing = cellOccupants[t.position];
                cellOccupants[t.position]++;

                const offsets = [[0, 0], [15, 15], [-15, 15], [15, -15], [0, 15], [0, -15]];
                const offX = offsets[existing % 6][0];
                const offY = offsets[existing % 6][1];

                const rect = cell.getBoundingClientRect();
                const boardRect = boardDiv.getBoundingClientRect();
                const left = rect.left - boardRect.left + (rect.width / 2) - 14 + offX;
                const top = rect.top - boardRect.top + (rect.height / 2) - 14 + offY;

                token.style.left = left + 'px';
                token.style.top = top + 'px';

                // Toggle active token layer/shadow
                if (id === turn) {
                    token.classList.add('active-turn');
                } else {
                    token.classList.remove('active-turn');
                }
            }
        } else {
            if (teamTokens[id]) {
                teamTokens[id].remove();
                delete teamTokens[id];
            }
        }
    });

    // Ownership
    boardState.forEach((obj, index) => {
        const sellBtnElement = document.getElementById(`sell-${index}`);
        if (sellBtnElement) sellBtnElement.style.display = 'none';

        if (obj && teams[obj.owner]) {
            const banner = document.getElementById(`own-${index}`);
            const team = teams[obj.owner];
            banner.style.background = team.color;
            banner.innerHTML = `<i class="fas ${team.icon}" style="font-size:8px; color:rgba(255,255,255,0.8); margin-left:3px;"></i>`;

            if (obj.level === 2) {
                banner.innerHTML += '<i class="fas fa-crown" style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); color:#ffd166; font-size:14px; text-shadow:0 0 5px rgba(0,0,0,0.8);"></i>';
            }

            // Show sell button if it's my property and I'm in debt OR it's my turn
            if (!isSpectator && obj.owner === myTeam && (teams[myTeam].money < 0 || turn === myTeam)) {
                if (sellBtnElement) sellBtnElement.style.display = 'block';
            }
        }
    });

    // Turn Logic
    if (!gameStarted) {
        turnIndicator.innerHTML = `⏳ <b>Đang chờ người chơi...</b><br>Trò chơi sẽ bắt đầu sau ${countdownTimer} giây.`;
        turnIndicator.style.background = 'rgba(255, 165, 0, 0.2)';
        rollBtn.disabled = true;
        buyBtn.disabled = true;
        upgradeBtn.disabled = true;
        takeoverBtn.style.display = 'none';
        chanceBtn.style.display = 'none';
        endBtn.disabled = true;
        return;
    }

    if (isSpectator) {
        const tName = turn && teams[turn] ? teams[turn].name : '...';
        turnIndicator.innerHTML = `👁️ Bạn đang xem lượt của <b>${tName}</b>`;
        turnIndicator.style.background = 'rgba(255, 255, 255, 0.1)';
        rollBtn.style.display = 'none';
        buyBtn.style.display = 'none';
        upgradeBtn.style.display = 'none';
        takeoverBtn.style.display = 'none';
        chanceBtn.style.display = 'none';
        endBtn.style.display = 'none';
        workBtn.style.display = 'none';
        return;
    }

    // If we are currently animating dice, don't overwrite button states yet
    if (isRolling) return;

    const currentTurnTeamInfo = teams[turn];
    const { hasRolled, hasPaidRentOrTax, hasPulledChance } = currentGameState.turnState || { hasRolled: false, hasPaidRentOrTax: false, hasPulledChance: false };

    const isMyTurn = (turn === myTeam);
    const myTeamBankrupt = myTeam && teams[myTeam].bankrupt;

    if (myTeamBankrupt) {
        turnIndicator.innerHTML = '💀 <span style="color:#d90429;">Tập đoàn bạn đã phá sản!</span> Lót dép xem mâm trên đấu đá.';
        turnIndicator.style.background = 'rgba(0,0,0,0.5)';
        rollBtn.disabled = true;
        buyBtn.disabled = true;
        upgradeBtn.disabled = true;
        takeoverBtn.style.display = 'none';
        chanceBtn.style.display = 'none';
        endBtn.disabled = true;
        workBtn.style.display = 'none';
    }
    else if (isMyTurn) {
        turnIndicator.innerHTML = '🎯 <span style="color:#06d6a0;">Lượt của tập đoàn bạn!</span><br><span style="font-size:0.8rem;color:#ccc;font-weight:normal;">Bất cứ ai trong nhóm cũng có thể bấm</span>';
        turnIndicator.style.background = 'rgba(6, 214, 160, 0.2)';

        rollBtn.disabled = hasRolled;
        // End button enabled only after roll
        endBtn.disabled = !hasRolled;

        // Buy/Upgrade visibility is usually handled by handlePostRoll, but we ensure consistency here
        if (!hasRolled) {
            buyBtn.style.display = 'none';
            upgradeBtn.style.display = 'none';
            takeoverBtn.style.display = 'none';
            chanceBtn.style.display = 'none';
        }
    } else {
        const tName = turn && teams[turn] ? teams[turn].name : '...';
        turnIndicator.innerHTML = `⏳ Đang đợi <b>${tName}</b> hành động...`;
        turnIndicator.style.background = 'rgba(0,0,0,0.3)';
        rollBtn.disabled = true;
        buyBtn.disabled = true;
        buyBtn.style.display = 'inline-block';
        upgradeBtn.disabled = true;
        upgradeBtn.style.display = 'none';
        takeoverBtn.style.display = 'none';
        chanceBtn.style.display = 'none';
        endBtn.disabled = true;
    }
}

socket.on('gameState', (state) => {
    const prevTurn = currentGameState ? currentGameState.turn : null;
    currentGameState = state;
    updateUI();

    const isMyTurn = state.turn === myTeam;
    const isBankrupt = state.teams && myTeam && state.teams[myTeam].bankrupt;
    if (isMyTurn && prevTurn !== myTeam && !isBankrupt) {
        // Just became my team's turn
        rollBtn.disabled = false;
        buyBtn.style.display = 'inline-block';
        buyBtn.disabled = true;
        upgradeBtn.style.display = 'none';
        takeoverBtn.style.display = 'none';
        endBtn.disabled = true;
        chanceBtn.style.display = 'none';
        diceResult.textContent = '?';
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Tới lượt tập đoàn của bạn!',
            showConfirmButton: false,
            timer: 3000
        });
    }
});
