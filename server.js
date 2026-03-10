const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// 4 Teams config
let teams = {
    team1: { id: 'team1', name: 'Tập đoàn Đỏ', color: '#e63946', icon: 'fa-building', money: 20, position: 0, bankrupt: false },
    team2: { id: 'team2', name: 'Liên minh Xanh Lá', color: '#2a9d8f', icon: 'fa-leaf', money: 20, position: 0, bankrupt: false },
    team3: { id: 'team3', name: 'Đế chế Vàng', color: '#e9c46a', icon: 'fa-crown', money: 20, position: 0, bankrupt: false },
    team4: { id: 'team4', name: 'Cá mập Xanh', color: '#457b9d', icon: 'fa-fish', money: 20, position: 0, bankrupt: false }
};

let teamMembers = {
    team1: new Set(),
    team2: new Set(),
    team3: new Set(),
    team4: new Set()
};

let boardState = Array(28).fill(null); // stores { owner: 'teamId', level: 1 }
let turnIndex = 0;
let teamOrder = []; // Will be determined when game starts
let gameStarted = false;
let countdownStarted = false;
let countdownTimer = 60;
let turnState = {
    hasRolled: false,
    hasPaidRentOrTax: false,
    hasPulledChance: false
};

const chances = [
    { title: "Lên Xu Hướng!", info: "Video TikTok của bạn viral. Lãnh 4 Tr", amount: 4 },
    { title: "Bị Phốt!", info: "Khách hàng tố cáo chất lượng kém. Phạt 3 Tr", amount: -3 },
    { title: "Gọi Vốn Thành Công", info: "Shark đầu tư 8 Tr", amount: 8 },
    { title: "Sập Server", info: "Tốn 2 Tr bảo trì", amount: -2 },
    { title: "Thuế Monpoly", info: "Đóng thuế Độc quyền 4 Tr", amount: -4 },
    { title: "Quỹ Đầu Tư Mạo Hiểm", info: "Nhận thêm 6 Tr vốn rót", amount: 6 },
    { title: "Kiện Tụng Bản Quyền", info: "Thua kiện, đền bù 5 Tr", amount: -5 },
    { title: "Đợt IPO Thành Công", info: "Cổ phiếu tăng phi mã, cộng 10 Tr", amount: 10 },
    { title: "Hacker Tấn Công", info: "Bị tống tiền dữ liệu, mất 4 Tr", amount: -4 },
    { title: "Thưởng Hiệu Quả", info: "Team làm việc tốt, cộng 3 Tr", amount: 3 }
];

const globalEvents = [
    { name: "Bão Sale 11/11", desc: "Doanh số bùng nổ, mọi Tập đoàn được bơm 5 Tr vốn!", amount: 5 },
    { name: "Khủng hoảng Kinh tế", desc: "Nhu cầu giảm, mỗi bên chịu thiệt 3 Tr!", amount: -3 },
    { name: "Quỹ Hỗ trợ Kỹ thuật số", desc: "Chính sách mới giải ngân 4 Tr cho mỗi bên", amount: 4 }
];

io.on('connection', (socket) => {
    let myTeam = null;

    socket.on('joinTeam', (teamId, playerName) => {
        if (gameStarted && !teamOrder.includes(teamId)) {
            socket.emit('errorMsg', `Trò chơi đã bắt đầu và Tập đoàn này không tham gia. Vui lòng chọn phe khác đang thi đấu: ${teamOrder.map(id => teams[id].name).join(', ')}`);
            return;
        }
        if (teamMembers[teamId].size >= 5) {
            socket.emit('errorMsg', `Tập đoàn ${teams[teamId].name} đã đạt giới hạn 5 người! Vui lòng chọn phe khác.`);
            return;
        }

        myTeam = teamId;
        socket.playerName = playerName; // Store player name
        teamMembers[teamId].add(socket.id);

        const teamInfo = teams[teamId];

        io.emit('gameState', getGameState());
        io.emit('chatMessage', `👋 <b>${playerName}</b> vừa gia nhập <b>${teamInfo.name}</b>!`);
        socket.emit('joinSuccess');

        // Start countdown if first person joins
        if (!countdownStarted && !gameStarted) {
            startCountdown();
        }
    });

    function startCountdown() {
        countdownTimer = 60;
        countdownStarted = true;
        let timer = setInterval(() => {
            countdownTimer--;
            io.emit('countdownUpdate', countdownTimer);
            if (countdownTimer <= 0) {
                clearInterval(timer);
                startGame();
            }
        }, 1000);
    }

    function startGame() {
        gameStarted = true;
        countdownStarted = false;

        // Define team order based on teams with members
        teamOrder = Object.keys(teamMembers).filter(tId => teamMembers[tId].size > 0);

        // Use default order if somehow no one is there (should not happen)
        if (teamOrder.length === 0) {
            gameStarted = false;
            countdownTimer = 60;
            return;
        }

        turnIndex = 0;
        turnState = {
            hasRolled: false,
            hasPaidRentOrTax: false,
            hasPulledChance: false
        };

        io.emit('gameStarted', { teamOrder });
        io.emit('gameState', getGameState());
        io.emit('actionLog', `🎮 <b style="color:#06d6a0; text-transform:uppercase;">TRÒ CHƠI BẮT ĐẦU!</b> Thứ tự lượt đi: ${teamOrder.map(id => teams[id].name).join(' → ')}`);
    }

    function checkBankrupt(teamId) {
        if (teams[teamId].money < 0 && !teams[teamId].bankrupt) {
            teams[teamId].bankrupt = true;
            // Clear their properties
            for (let i = 0; i < boardState.length; i++) {
                if (boardState[i] && boardState[i].owner === teamId) {
                    boardState[i] = null;
                }
            }
            io.emit('actionLog', `💥 <b style="color:#d90429; font-size:1.1rem; text-transform:uppercase;">${teams[teamId].name} ĐÃ PHÁ SẢN!</b> Mọi tài sản bị ném ra thị trường tự do!`);

            // Nếu chết đúng lúc đang tới lượt, chuyển lượt ngay
            if (teamOrder[turnIndex] === teamId) {
                let nextIndex = turnIndex;
                let found = false;
                for (let i = 0; i < teamOrder.length; i++) {
                    nextIndex = (nextIndex + 1) % teamOrder.length;
                    if (!teams[teamOrder[nextIndex]].bankrupt) {
                        turnIndex = nextIndex;
                        found = true;
                        break;
                    }
                }
                if (found) hasRolled = false;
            }

            checkWinner();
        }
    }

    function checkWinner() {
        const alive = teamOrder.filter(id => !teams[id].bankrupt);
        if (alive.length === 1) {
            io.emit('gameOver', { winner: teams[alive[0]] });
            io.emit('actionLog', `🏆 <b>${teams[alive[0]].name}</b> ĐÃ TRỞ THÀNH KẺ ĐỘC QUYỀN DUY NHẤT. GAME OVER!`);
        }
    }

    socket.on('rollDice', () => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex] && !turnState.hasRolled) {
            turnState.hasRolled = true;
            turnState.hasPaidRentOrTax = false;
            turnState.hasPulledChance = false;
            const dice = Math.floor(Math.random() * 6) + 1;
            const team = teams[myTeam];
            const oldPos = team.position;
            team.position = (team.position + dice) % 28;

            // Pass Start - Lương tỉ lệ thuận với số nhân viên!
            let msgStart = "";
            if (team.position < oldPos) {
                const teamSize = teamMembers[myTeam].size;
                const salary = 3 + (teamSize * 2); // 3M gốc + 2M x số người
                team.money += salary;
                msgStart = ` (Qua trạm, nhận ${salary}M doanh thu với ${teamSize} nhân sự!)`;
            }

            io.emit('diceRolled', { teamId: myTeam, dice, newPos: team.position, msgStart });
            // gameState sent after UI handles dice roll animation
            setTimeout(() => {
                io.emit('gameState', getGameState());
            }, 1000);
        }
    });

    socket.on('takeoverProperty', (propertyIndex, price) => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex]) {
            const team = teams[myTeam];
            const property = boardState[propertyIndex];
            if (property && property.owner !== myTeam) {
                const takeoverPrice = price * 2; // Thâu tóm tốn gấp đôi
                if (team.money >= takeoverPrice) {
                    const oldOwner = property.owner;
                    team.money -= takeoverPrice;
                    // Đối phương nhận được 1/2 số tiền thâu tóm (coi như bán lại cưỡng chế)
                    teams[oldOwner].money += Math.floor(takeoverPrice / 2);
                    boardState[propertyIndex] = { owner: myTeam, level: property.level };
                    io.emit('gameState', getGameState());
                    io.emit('actionLog', `⚔️ <b>${team.name}</b> đã THÂU TÓM thô bạo tài sản của <b>${teams[oldOwner].name}</b> tại ô ${propertyIndex}!`);
                    checkBankrupt(oldOwner); // Có thể cứu hoặc đẩy đối phương vào phá sản
                }
            }
        }
    });

    socket.on('triggerChance', () => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex] && !turnState.hasPulledChance) {
            turnState.hasPulledChance = true;
            const chance = chances[Math.floor(Math.random() * chances.length)];
            const team = teams[myTeam];
            team.money += chance.amount;
            io.emit('chancePulled', { teamId: myTeam, chance });
            io.emit('actionLog', `🃏 <b>${team.name}</b> rút thẻ Cơ hội: ${chance.title} (${chance.amount > 0 ? '+' : ''}${chance.amount}M)`);
            checkBankrupt(myTeam);
            io.emit('gameState', getGameState());
        }
    });

    socket.on('buyProperty', (propertyIndex, price) => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex]) {
            const team = teams[myTeam];
            if (team.money >= price && boardState[propertyIndex] === null) {
                team.money -= price;
                boardState[propertyIndex] = { owner: myTeam, level: 1 };
                io.emit('gameState', getGameState());
                io.emit('actionLog', `💼 <b>${team.name}</b> đã thâu tóm khởi nghiệp tại ô ${propertyIndex}. Tiến vào thị trường!`);
            }
        }
    });

    socket.on('upgradeProperty', (propertyIndex, price) => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex]) {
            const team = teams[myTeam];
            if (team.money >= price && boardState[propertyIndex] && boardState[propertyIndex].owner === myTeam && boardState[propertyIndex].level === 1) {
                team.money -= price;
                boardState[propertyIndex].level = 2; // Level 2: Monopoly
                io.emit('gameState', getGameState());
                io.emit('actionLog', `🚀 <b>${team.name}</b> đã NÂNG CẤP ĐỘC QUYỀN tại ô ${propertyIndex}! Giá dịch vụ tăng x3.`);
            }
        }
    });

    socket.on('payRent', (propertyIndex, rentAmount) => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex] && !turnState.hasPaidRentOrTax) {
            turnState.hasPaidRentOrTax = true;
            const team = teams[myTeam];
            const ownerObj = boardState[propertyIndex];
            if (ownerObj && ownerObj.owner !== myTeam) {
                const actualRent = ownerObj.level === 2 ? rentAmount * 3 : rentAmount;
                team.money -= actualRent;
                teams[ownerObj.owner].money += actualRent;
                io.emit('actionLog', `💸 <b>${team.name}</b> bị <b>${teams[ownerObj.owner].name}</b> bóc lột ${actualRent} Tr!`);
                checkBankrupt(myTeam);
                io.emit('gameState', getGameState());
            }
        }
    });

    socket.on('payTax', (amount, reason) => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex] && !turnState.hasPaidRentOrTax) {
            turnState.hasPaidRentOrTax = true;
            const team = teams[myTeam];
            // Phạt theo quy mô công ty. Đông nhân viên -> Thuế đóng cao hơn.
            const teamSize = teamMembers[myTeam].size;
            const actualTax = amount + (teamSize * 1); // Cộng thêm 1M cho mỗi thành viên (quản lý cồng kềnh)

            team.money -= actualTax;
            io.emit('actionLog', `🏛️ <b>${team.name}</b> bị phạt ${actualTax}M (Đã tính phí hệ thống cho ${teamSize} nhân sự) vì: ${reason}`);
            checkBankrupt(myTeam);
            io.emit('gameState', getGameState());
        }
    });

    socket.on('workGig', () => {
        if (myTeam && !teams[myTeam].bankrupt) {
            const now = Date.now();
            if (!socket.lastWorked || now - socket.lastWorked >= 15000) { // 15 giây cooldown
                socket.lastWorked = now;
                const earned = Math.floor(Math.random() * 2) + 1; // 1 hoặc 2 M
                teams[myTeam].money += earned;
                socket.emit('workedSuccess', earned, 15);
                socket.broadcast.emit('chatMessage', `👨‍💻 <b>${socket.playerName || 'Một nhân viên'}</b> vừa Tăng ca (OT) đem về <b>${earned}M</b> cho ${teams[myTeam].name}!`);
                io.emit('gameState', getGameState());
            } else {
                const left = Math.ceil((15000 - (now - socket.lastWorked)) / 1000);
                socket.emit('errorMsg', `Bạn đang kiệt sức! Mác nói cấm bóc lột quá mức. Chờ thêm ${left}s.`);
            }
        }
    });

    socket.on('endTurn', () => {
        if (!gameStarted) return;
        if (myTeam === teamOrder[turnIndex]) {
            let nextIndex = turnIndex;
            let found = false;
            for (let i = 0; i < teamOrder.length; i++) {
                nextIndex = (nextIndex + 1) % teamOrder.length;
                if (!teams[teamOrder[nextIndex]].bankrupt) {
                    turnIndex = nextIndex;
                    found = true;
                    break;
                }
            }

            if (found) {
                turnState.hasRolled = false;
                turnState.hasPaidRentOrTax = false;
                turnState.hasPulledChance = false;
                io.emit('gameState', getGameState());

                // Random Global Event (15% chance to spice things up)
                if (Math.random() < 0.15) {
                    const ev = globalEvents[Math.floor(Math.random() * globalEvents.length)];
                    teamOrder.forEach(tId => {
                        if (!teams[tId].bankrupt) {
                            teams[tId].money += ev.amount;
                        }
                    });
                    teamOrder.forEach(tId => checkBankrupt(tId));
                    io.emit('globalEvent', ev);
                    io.emit('gameState', getGameState());
                }
            }
        }
    });

    socket.on('disconnect', () => {
        if (myTeam) {
            teamMembers[myTeam].delete(socket.id);
            // Optionally handle empty team logic, but for a 4-team game we just leave it
        }
    });

    function getGameState() {
        return {
            teams,
            teamOrder,
            turn: teamOrder[turnIndex] || null,
            boardState,
            gameStarted,
            countdownTimer,
            memberCounts: {
                team1: teamMembers.team1.size,
                team2: teamMembers.team2.size,
                team3: teamMembers.team3.size,
                team4: teamMembers.team4.size
            }
        };
    }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Cờ tỷ phú tư bản đang chạy tại http://0.0.0.0:${PORT}`);
});
