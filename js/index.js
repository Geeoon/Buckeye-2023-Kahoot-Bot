import { io } from "socket.io-client";

const SOCKET_DOMAIN = "https://infinity.chall.pwnoh.io:443";

let lastScoreboard = {};
let socket_ids = [];
let scoreFetcher = null;

class Guesser {
    constructor(choice) {
        this.choice = choice;
        this.socket = io(SOCKET_DOMAIN);
        this.socket.on("connect", () => {
            this.id = this.socket.id;
            socket_ids.push(this.id);
            console.log("Guesser " + choice + " connected.", this.id);
        });
        this.socket.on("connect_error", () => {
            console.log("Error.");
        });
        this.socket.on("disconnect", () => {
            console.log("Socket disconnected.");
        });
        this.socket.on("gameState", (state) => {
            if (state.correctAnswer == undefined) {
                // new round, start guessing.
                this.socket.emit("answer", choice);
                console.log("Making guess.");
                if (scoreFetcher === null) {
                    scoreFetcher = new ScoreboardFetcher();
                }
            } else {
                // end of round, cleanup
                if (scoreFetcher !== null) {
                    scoreFetcher.kill();
                    scoreFetcher = null;
                }
            }
        });
    }
}

class ScoreboardFetcher {
    constructor() {
        console.log("Constructing fetcher...");
        this.socket = io(SOCKET_DOMAIN);
        this.socket.on("gameState", (state) => {
            // game state arrived.
            let ourGuesserScores = Object.keys(state.scoreboard)
                .filter(key => socket_ids.includes(key))
                .reduce((obj, key) => {
                    obj[key] = state.scoreboard[key];
                    return obj;
                }, {});
            
            if (Object.keys(ourGuesserScores).length < 4) {
                console.log("Still building last scoreboard");
            } else {
                let winner = Object.keys(ourGuesserScores).reduce(function(a, b){ return ourGuesserScores[a] > ourGuesserScores[b] ? a : b });
                if (players.length == 4) {
                    for (let j = 0; j < 4; j++) {
                        if (players[j].id === winner) {
                            console.log("You should pick", players[j].choice + 1);
                        }
                    }
                }
            }
            this.kill();
        });
    }
    
    // call this before deleting.
    kill() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.socket = null;
    }
}

let players = [];
for (let i = 0; i < 4; i++) {
    players.push(new Guesser(i));
}

