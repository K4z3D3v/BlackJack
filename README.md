# Black Jack

Black Jack realizzato in java usando node.js e socket.io

## Getting Started

Queste istruzioni vi spiegheranno come startare il progetto.
Verrà spiegato come installare Node.js insieme a Socket.io e come utilizzrli.

### Requisiti

Requisiti per questo progetto:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download)
- [Socket.io](https://socket.io/)

### Installazione

Uno step-by-step su come settare il tutto.

1.  Copiamo la repo.

    ```
        git clone https://github.com/Zose1244/BlackJack.git
    ```

2.  Entriamo dentro la cartella

    ```
        cd BlackJack
    ```

3.  Installiamo i pacchetti necessari di node.js

    ```
        npm init
    ```

    Fatto ciò premete Enter finche non arrivate alla scritta "Is this OK? (yes)", fate un altra volta Enter e avete fatto.

4.  Installiamo socket.io

    ```
        npm i socket.io
    ```

5.  (Facoltativo) Installiamo nodemon, serve per poter applicare i cambiamenti al server senza restartarlo ogni volta.

    ```
        npm i --save-dev nodemon
    ```

## Come testare

Startiamo il server

```
    cd BlackJack
```

```
    node server.js
```

Se avete installato nodemon:

```
    nodemon server.js
```

Se fino ad ora avete fatto tutto nel modo corretto, vi dovrebbe spuntare una scritta che vi da il link http://localhost:3000. Apritelo.

## Authors

- **Daniele Sarakula** - _Letteralmente quello che ha fatto tutto_ -
  [K4z3D3v](https://github.com/K4z3D3v)
