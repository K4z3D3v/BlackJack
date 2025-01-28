const socket = io('http://localhost:3000');
const nomeGiocatore = localStorage.getItem('nomeGiocatore') || 'Guest';
localStorage.setItem('nomeGiocatore', nomeGiocatore);
socket.emit('joinRoom', nomeGiocatore);


let Giocatore = '';

socket.on('aggiornaGiocatori', (giocatori, dealer, turnoCorrente) => {
    const idGiocatore = socket.id;
    Giocatore = giocatori.find(g => g.id === idGiocatore);
    const idGiocatori = ['player1', 'player2', 'player3', 'player4', 'player5'];
    idGiocatori.forEach((id, index) => {
        const divGiocatore = document.getElementById(id);
        if (giocatori[index]) {
            if (!divGiocatore) {
                const nuovoDiv = document.createElement('div');
                nuovoDiv.id = id;
                nuovoDiv.className = 'player-area';
                nuovoDiv.innerHTML = `
                    <span class="player-info"></span>
                    <div class="card-container"></div>
                    <div class="punteggio-giocatore"></div>`;
                document.getElementById('table').appendChild(nuovoDiv);
            }
            const divGioAggiornato = document.getElementById(id);
            divGioAggiornato.querySelector('.player-info').textContent =`${giocatori[index].nome}`;
            divGioAggiornato.querySelector('.punteggio-giocatore').textContent = giocatori[index].punteggio;
            document.getElementById('saldoVal').textContent = '';
            document.getElementById('saldoVal').textContent = giocatori[index].saldo;
            const cardContainer = divGioAggiornato.querySelector('.card-container');
            cardContainer.innerHTML = '';
            giocatori[index].carte.forEach((carta) => {
                const elCarta = document.createElement('div');
                elCarta.className = `card ${['♥', '♦'].includes(carta.seme) ? 'red' : 'black'}`;
                elCarta.textContent = `${carta.valore}${carta.seme}`;
                cardContainer.appendChild(elCarta);
            });
            

            if (index === turnoCorrente) {
                divGioAggiornato.classList.add('highlight');
            } else {
                divGioAggiornato.classList.remove('highlight');
            }
        } else if (divGiocatore) {
            divGiocatore.remove();
        }
    });

    const cardContainer = document.getElementById('dealer-card-container');
    const dealerPunteggio = document.getElementById('punteggio-dealer');
    dealerPunteggio.innerHTML = dealer.punteggio;
    cardContainer.innerHTML = '';
    dealer.carte.forEach((carta, index) => {
        const elCarta = document.createElement('div');
        elCarta.className = `card ${['♥', '♦'].includes(carta.seme) ? 'red' : 'black'}`;
        elCarta.textContent =
            index === 0 && !dealer.mostraCarte ? 'XX' : `${carta.valore}${carta.seme}`;
        cardContainer.appendChild(elCarta);
    });
});

socket.on('fineRound', () => { 
    const risultatoDiv = document.getElementById('risultati');
    const risultatoTesto = document.getElementById('risTesto');
    const blurB = document.getElementById('blurB');

    if (Giocatore) {
        setTimeout(() => {
            risultatoDiv.style.display = 'flex';
            blurB.style.display = 'block';
            console.log(Giocatore.stato);
            if (Giocatore.stato === 'Bust') risultatoTesto.textContent = 'Hai perso!';
            else if (Giocatore.stato === 'Pareggio') risultatoTesto.textContent = 'Pareggio!';
            else if (Giocatore.stato === 'Vinto') risultatoTesto.textContent = 'Hai Vinto!';
            else if (Giocatore.stato === 'Perso') risultatoTesto.textContent = 'Hai perso!';
            else risultatoTesto.textContent = 'X';

            setTimeout(() => {
                risultatoDiv.style.display = 'none';
                blurB.style.display = 'none';
            }, 2000);
        }, 3000);
    }
});

socket.on('aggiornaRound', (round) => {
    document.getElementById('roundValue').innerHTML = '';
    document.getElementById('roundValue').innerHTML = `${round.toString()}`;
});

socket.on('alert', (messaggio) => {
    const risultatoDiv = document.getElementById('risultati');
    const risultatoTesto = document.getElementById('risTesto');
    const blurB = document.getElementById('blurB')
    risultatoDiv.style.display = 'flex';
    blurB.style.display = 'block';
    risultatoTesto.textContent = messaggio;
    setTimeout(() => {
        risultatoDiv.style.display = 'none';
        blurB.style.display = 'none';
        risultatoTesto.textContent = '';
    }, 3000);
});


document.getElementById('punta').addEventListener('click', () => {
    console.log('ho cliccato');
    let puntata = document.getElementById('vPuntata').value;
    socket.emit('punta', puntata, socket.id);
});

document.getElementById('hit').addEventListener('click', () => {
    socket.emit('hit');
});

document.getElementById('stand').addEventListener('click', () => {
    socket.emit('stand');
    
});
