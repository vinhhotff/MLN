const socket = io();

// Constants
const spaces = [
    { name: "TRẢ LƯƠNG", type: "start", info: "Lãnh 2 Tr" }, // 0
    { name: "Sàn Shopee", type: "prop", price: 2, rent: 1, color: "#f94144" },
    { name: "Thuế CĐR", type: "tax", rent: 1, info: "Nộp 1 Tr" },
    { name: "BẪY CHI PHÍ", type: "trap", info: "Mất 2 Tr", amount: 2 },
    { name: "Shopee Express", type: "prop", price: 3, rent: 1, color: "#f94144" },
    { name: "Thẻ Cơ Hội", type: "chance", info: "Rút Thẻ" },
    { name: "Shopee Mall", type: "prop", price: 4, rent: 2, color: "#f94144" },
    { name: "SỞ CẢNH SÁT", type: "jail", info: "Tham Quan" }, // 7
    { name: "GrabBike", type: "prop", price: 4, rent: 2, color: "#06d6a0" },
    { name: "Thẻ Cơ Hội", type: "chance", info: "Rút Thẻ" },
    { name: " TRẠM PHÍ", type: "fee", info: "Phí 2 Tr", amount: 2 },
    { name: "GrabFood", type: "prop", price: 5, rent: 3, color: "#06d6a0" },
    { name: "Mạng FPT", type: "prop", price: 4, rent: 2, color: "#777" },
    { name: "GrabCar", type: "prop", price: 6, rent: 3, color: "#06d6a0" },
    { name: "BÃI ĐỖ XE", type: "parking", info: "Nghỉ Ngơi" }, // 14
    { name: "Kênh TikTok", type: "prop", price: 6, rent: 3, color: "#000" },
    { name: "Thẻ Cơ Hội", type: "chance", info: "Rút Thẻ" },
    { name: "BẪY QUẢNG CÁO", type: "trap", info: "Mất 3 Tr", amount: 3 },
    { name: "TikTok Live", type: "prop", price: 7, rent: 4, color: "#000" },
    { name: "Chống Độc Quyền", type: "tax", rent: 2, info: "Nộp 2 Tr" },
    { name: "TikTok Shop", type: "prop", price: 8, rent: 4, color: "#000" },
    { name: "BỊ ĐIỀU TRA!", type: "gotojail", info: "Lạm dụng Độc quyền" }, // 21
    { name: "BeBike", type: "prop", price: 8, rent: 4, color: "#ffd166" },
    { name: "Thẻ Cơ Hội", type: "chance", info: "Rút Thẻ" },
    { name: "PHÍ HỆ THỐNG", type: "fee", info: "Phí 3 Tr", amount: 3 },
    { name: "BeCar", type: "prop", price: 9, rent: 5, color: "#ffd166" },
    { name: "Mạng Viettel", type: "prop", price: 4, rent: 2, color: "#777" },
    { name: "BeFood", type: "prop", price: 10, rent: 6, color: "#ffd166" }
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

let myTeam = null;
let playerName = "";
let currentGameState = null;

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
        cell.innerHTML = content;
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

socket.on('errorMsg', (msg) => {
    Swal.fire('Thất bại', msg, 'error');
    joinBtn.disabled = false;
    joinBtn.textContent = 'Tham Gia Thị Trường';
});

socket.on('joinSuccess', () => {
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'flex';
});

// Controls
rollBtn.addEventListener('click', () => {
    socket.emit('rollDice');
    rollBtn.disabled = true;
});

buyBtn.addEventListener('click', () => {
    const team = currentGameState.teams[myTeam];
    const pos = team.position;
    socket.emit('buyProperty', pos, spaces[pos].price);
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
    socket.emit('upgradeProperty', pos, spaces[pos].price);
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
    endBtn.disabled = false;
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
            socket.emit('takeoverProperty', pos, originalPrice);
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

socket.on('diceRolled', (data) => {
    const { teamId, dice, newPos, msgStart } = data;
    const teamName = currentGameState.teams[teamId].name;

    // Animate dice
    diceResult.style.display = 'none';
    diceIcon.style.display = 'inline-block';

    setTimeout(() => {
        diceIcon.style.display = 'none';
        diceResult.style.display = 'block';
        diceResult.textContent = dice;

        addChat(`🎲 <b>${teamName}</b> tung được <b>${dice}</b>. ${msgStart}`);

        // Handle logic if it's my team
        if (teamId === myTeam) {
            handlePostRoll(newPos);
        }
    }, 1000);
});

socket.on('chancePulled', (data) => {
    if (data.teamId === myTeam) {
        Swal.fire({
            title: data.chance.title,
            text: data.chance.info,
            icon: data.chance.amount > 0 ? 'success' : 'error',
            confirmButtonColor: '#2a9d8f'
        });
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
            socket.emit('payRent', pos, space.rent);
            Swal.fire('Bị Bóc Lột!', `Bạn dẫm vào thị phần của <b>${currentGameState.teams[ownerObj.owner].name}</b>. Bị ép trả ${actualRent}Tr tiền dịch vụ!`, 'error');

            // Show takeover option
            if (team.money >= space.price * 2) {
                takeoverBtn.style.display = 'inline-block';
                takeoverBtn.disabled = false;
            }
        }
    } else if (space.type === 'tax') {
        socket.emit('payTax', space.rent, space.info);
        Swal.fire('Đóng Thuế', `${space.name}: ${space.info}`, 'info');
    } else if (space.type === 'trap') {
        socket.emit('payTax', space.amount, space.info);
        Swal.fire('💀 SẬP BẪY!', `${space.name}: ${space.info}`, 'error');
    } else if (space.type === 'fee') {
        socket.emit('payTax', space.amount, space.info);
        Swal.fire('⛽ TRẠM PHÍ', `${space.name}: ${space.info}`, 'warning');
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

    // Clear tokens
    for (let i = 0; i < 28; i++) {
        const tc = document.getElementById(`tc-${i}`);
        const own = document.getElementById(`own-${i}`);
        if (tc) tc.innerHTML = '';
        if (own) {
            own.style.background = 'transparent';
            own.innerHTML = '';
        }
    }

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
            const token = document.createElement('div');
            token.className = 'token';
            token.style.background = t.color;
            token.style.color = '#fff';

            // Use team icon for token
            token.innerHTML = `<i class="fas ${t.icon}" style="font-size:10px;"></i>`;

            const tc = document.getElementById(`tc-${t.position}`);
            if (tc) {
                const existing = tc.children.length;
                const offsets = [[0, 0], [15, 15], [-15, 15], [15, -15], [0, 15], [0, -15]];
                token.style.transform = `translate(${offsets[existing % 6][0]}px, ${offsets[existing % 6][1]}px)`;
                tc.appendChild(token);
            }
        }
    });

    // Ownership
    boardState.forEach((obj, index) => {
        if (obj && teams[obj.owner]) {
            const banner = document.getElementById(`own-${index}`);
            const team = teams[obj.owner];
            banner.style.background = team.color;
            banner.innerHTML = `<i class="fas ${team.icon}" style="font-size:8px; color:rgba(255,255,255,0.8); margin-left:3px;"></i>`;

            if (obj.level === 2) {
                banner.innerHTML += '<i class="fas fa-crown" style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); color:#ffd166; font-size:14px; text-shadow:0 0 5px rgba(0,0,0,0.8);"></i>';
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
        chanceBtn.style.display = 'none';
        endBtn.disabled = true;
        return;
    }

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
        workBtn.style.display = 'none'; // Kẻ phá sản không được cày OT
    }
    else if (isMyTurn) {
        turnIndicator.innerHTML = '🎯 <span style="color:#06d6a0;">Lượt của tập đoàn bạn!</span><br><span style="font-size:0.8rem;color:#ccc;font-weight:normal;">Bất cứ ai trong nhóm cũng có thể bấm</span>';
        turnIndicator.style.background = 'rgba(6, 214, 160, 0.2)';
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
