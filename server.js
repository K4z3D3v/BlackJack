const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

const maxGiocatori = 5;
const maxCarte = 5;
let giocatori = [];
let mazzo = creaMazzo();
let dealer = {
    carte: [],
    mostraCarte: false,
    punteggio: 0,
};

let turnoCorrente = 0;
let roundCorrente = 0;
let roundIniziato = false;

server.listen(port, () => {
    console.log(`http://localhost:${port}`);
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (nome) => {
        if (giocatori.length >= maxGiocatori) {
            socket.emit('alert', 'La stanza è piena!');
            return;
        }
        const giocatoreEsistente = giocatori.find((p) => p.id === socket.id);
        if (giocatoreEsistente) {
            giocatoreEsistente.nome = nome;
        } else {
            const nuovoGiocatore = {
                id: socket.id,
                nome,
                carte: [],
                stand: true,
                punteggio: 0,
                stato: '',
                saldo: 500,
                sommaSc: 0,
                haScommesso: false,
            };
            nuovoGiocatore.punteggio = aggiornaPunteggio(nuovoGiocatore.carte);
            giocatori.push(nuovoGiocatore);
        }
        io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
    });

    socket.on('hit', () => {
        if (giocatori[turnoCorrente]?.id === socket.id) {
            const giocatore = giocatori.find((g) => g.id === socket.id);
            if (!giocatore.haScommesso) {
                socket.emit('alert', 'Devi prima scommettere');
                return;
            }
            if (giocatore && giocatore.carte.length < maxCarte) {
                if (mazzo.length === 0) mazzo = creaMazzo();
                daiCarte(1, giocatore);
                giocatore.punteggio = aggiornaPunteggio(giocatore.carte);
                if (giocatore.punteggio > 21) {
                    giocatore.stand = true;
                    giocatore.punteggio = 'Bust';
                    giocatore.stato = 'Bust';
                    prossimoTurno();
                    return;
                }
                io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
            } else {
                socket.emit('alert', 'Hai raggiunto il numero massimo di carte!');
                giocatore.stand = true;
                prossimoTurno();
            }
        } else {
            socket.emit('alert', 'Non è il tuo turno!');
        }
    });

    socket.on('stand', () => {
        const giocatore = giocatori.find((g) => g.id === socket.id);
        if (!giocatore.haScommesso) {
            socket.emit('alert', 'Devi prima scommettere');
            return;
        }
        if (giocatori[turnoCorrente]?.id === socket.id) {
            giocatori[turnoCorrente].stand = true;
            prossimoTurno();
        } else {
            socket.emit('alert', 'Non è il tuo turno!');
        }
    });

    socket.on('disconnect', () => {
        giocatori = giocatori.filter((p) => p.id !== socket.id);
        io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
    });

    socket.on('punta', (puntata, giocatoreId) => {
        const giocatore = giocatori.find((g) => g.id === giocatoreId);
        if(giocatore.saldo - puntata < 0){
            socket.emit('alert', 'Non hai abbastanza soldi!');
            return;
        }
        if (giocatore.saldo <= 0){
            socket.emit('alert', 'Non hai abbastanza soldi!');
            return;
        }
        if (giocatore.haScommesso) {
            socket.emit('alert', 'Hai già scommesso!');
            return;
        }else if (roundIniziato == true){
            socket.emit('alert', 'Partita gia iniziata');
            giocatore.stand == true;
            return;
        } else {
            giocatore.stand == false;
            giocatore.haScommesso = true;
            giocatore.sommaSc = puntata;
            giocatore.saldo -= puntata;
        }
        if (giocatori.every((g) => g.haScommesso)) {
            iniziaRound();
        } else {
            io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
        }
    });
});

function creaMazzo() {
    let deck = [];
    const semi = ['♠', '♥', '♦', '♣'];
    const valori = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    semi.forEach((seme) => {
        valori.forEach((valore) => {
            deck.push({ seme, valore });
        });
    });

    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function iniziaRound() {
    roundIniziato = true;
    giocatori.forEach((giocatore) => {
        giocatore.carte = [];
        daiCarte(2, giocatore);
        giocatore.punteggio = aggiornaPunteggio(giocatore.carte);
        giocatore.stand = false;
    });

    dealer.carte = [];
    daiCarte(2, dealer);
    dealer.mostraCarte = false;
    dealer.punteggio = aggiornaPunteggio(dealer.carte, false);

    io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
    io.emit('aggiornaRound', roundCorrente);
    roundCorrente = roundCorrente + 1;
}

function resetGame() {
    roundIniziato = false;
    turnoCorrente = 0;
    giocatori.forEach((giocatore) => {
        giocatore.carte = [];
        giocatore.stand = false;
        giocatore.punteggio = 0;
        if (giocatore.haScommesso) {
            giocatore.sommaSc = 0;
            giocatore.haScommesso = false;
        }
    });
    dealer.carte = [];
    dealer.mostraCarte = false;
    dealer.punteggio = 0;
    mazzo = creaMazzo();
    io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
}

function prossimoTurno() {
    if (giocatori.every((g) => g.stand || g.punteggio === 'Bust')) {
        dealerPlay();
    } else {
        do {
            turnoCorrente = (turnoCorrente + 1) % giocatori.length;
        } while (
            giocatori[turnoCorrente].stand ||
            giocatori[turnoCorrente].punteggio >= 21
        );
        io.emit('aggiornaTurno', turnoCorrente);
    }
    io.emit('aggiornaGiocatori', giocatori, dealer, turnoCorrente);
}

function dealerPlay() {
    dealer.mostraCarte = true;
    dealer.punteggio = aggiornaPunteggio(dealer.carte);
    while (dealer.punteggio < 17) {
        if (mazzo.length === 0) mazzo = creaMazzo();
        daiCarte(1, dealer);
        dealer.punteggio = aggiornaPunteggio(dealer.carte);
        controllaVincitori();
    }
    setTimeout(resetGame, 5000);
}

function aggiornaPunteggio(carte, mostraTutte = true) {
    let punteggio = 0;
    let assi = 0;

    const carteDaCalcolare = mostraTutte ? carte : [carte[1]];

    carteDaCalcolare.forEach((carta) => {
        if (carta.valore === 'A') assi++;
        else if (['J', 'Q', 'K'].includes(carta.valore)) punteggio += 10;
        else punteggio += parseInt(carta.valore);
    });

    while (assi--) {
        punteggio += (punteggio + 11 <= 21) ? 11 : 1;
    }
    return punteggio;
}

function daiCarte(nCarte, ogg) {
    for (let i = 0; i < nCarte; i++) {
        ogg.carte.push(mazzo.pop());
    }
}

function controllaVincitori() {
    giocatori.forEach((giocatore) => {

        if (dealer.punteggio === 'Bust') {
            if (giocatore.punteggio === 'Bust') {
                giocatore.stato = 'Perso';
            } else {
                giocatore.stato = 'Vinto';
                giocatore.saldo += giocatore.sommaSc * 2;
            }
            io.emit('fineRound');
            return;
        }

        if (giocatore.punteggio === 'Bust') {
            giocatore.stato = 'Perso';
            io.emit('fineRound');
            return;
        }

        if (giocatore.punteggio > dealer.punteggio && giocatore.punteggio <= 21) {
            giocatore.stato = 'Vinto';
            giocatore.saldo += giocatore.sommaSc * 2;
            io.emit('fineRound');
            return;
        } else if (giocatore.punteggio < dealer.punteggio && dealer.punteggio <= 21) {
            giocatore.stato = 'Perso';
            io.emit('fineRound');
            return;
        } else if (giocatore.punteggio == dealer.punteggio) {
            giocatore.stato = 'Pareggio';
            giocatore.saldo += giocatore.sommaSc;
            io.emit('fineRound');
            return;
        }
    });
}




// Da qua in poi accade la magia nera
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'HTML/initialPage.html'));
});

app.get('/room', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'HTML/room.html'));
});

