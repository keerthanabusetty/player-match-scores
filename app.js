const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//API-1 Returns all players in player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
    *
    FROM
    player_details;
    `;
  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});
//API-2 Return specific player based on playerId
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT
  *
  FROM
  player_details
  WHERE player_id = ${playerId};`;
  const playerQuery = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(playerQuery));
});
//API-3 updated specific player based on playerId
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatedPlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = ${playerId};
    `;
  await db.run(updatedPlayerQuery);
  response.send("Player Details Updated");
});
//API-4 Returns match_details of specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    *
    FROM
    match_details
    WHERE
    match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(match));
});
//API-5 Returns all matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchQuery = `
    SELECT 
    *
    FROM
    player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const player = await db.all(playerMatchQuery);
  response.send(
    player.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});
//API-6 Returns all players on specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const playersQuery = `
    SELECT
    *
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    match_id = ${matchId};`;
  const players = await db.all(playersQuery);
  response.send(
    players.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});
//API-7
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE
    player_id = ${playerId};`;
  const playerMatchDetails = await db.get(getPlayerDetailsQuery);
  response.send(playerMatchDetails);
});
module.exports = app;
