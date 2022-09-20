const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDBPlayerObjectToResponseObject = (DBObject) => {
  return {
    playerId: DBObject.player_id,
    playerName: DBObject.player_name,
  };
};
const convertDBMatchObjectToResponseObject = (DBObject) => {
  return {
    matchId: DBObject.match_id,
    match: DBObject.match,
    year: DBObject.year,
  };
};
const convertDBPlayerAndMatchObjectToResponseObject = (DBObject) => {
  return {
    playerMatchId: DBObject.player_match_id,
    playerId: DBObject.player_id,
    matchId: DBObject.match_id,
    score: DBObject.score,
    fours: DBObject.fours,
    sixes: DBObject.sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT * 
    FROM player_details
    ORDER BY 
    player_id;`;
  const playerList = await db.all(getPlayerQuery);
  response.send(
    playerList.map((eachplayer) =>
      convertDBPlayerObjectToResponseObject(eachplayer)
    )
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM
    player_details
    WHERE player_id =${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertDBPlayerObjectToResponseObject(player));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE player_details
  SET  player_name = '${playerName}'
  WHERE player_id =${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM
    match_details
    WHERE match_id=${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertDBMatchObjectToResponseObject(match));
});
//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM
    player_match_score NATURAL JOIN match_details
    WHERE player_match_score.player_id =${playerId};`;
  const match = await db.all(getPlayerMatchQuery);
  response.send(
    match.map((eachMacth) => convertDBMatchObjectToResponseObject(eachMacth))
  );
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM
    player_match_score NATURAL JOIN player_details
    WHERE player_match_score.match_id =${matchId};`;
  const match = await db.all(getPlayerMatchQuery);
  response.send(
    match.map((eachMacth) => convertDBPlayerObjectToResponseObject(eachMacth))
  );
});

//API 7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
    SELECT player_details.player_id,player_details.player_name,SUM(score),
    SUM(fours),SUM(sixes)
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_match_score.player_id=${playerId};`;
  const playerScores = await db.get(getPlayerStatsQuery);
  //console.log(playerScores);
  response.send({
    playerId: playerScores.player_id,
    playerName: playerScores.player_name,
    totalScore: playerScores["SUM(score)"],
    totalFours: playerScores["SUM(fours)"],
    totalSixes: playerScores["SUM(sixes)"],
  });
});
module.exports = app;
