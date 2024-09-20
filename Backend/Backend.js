var express = require("express");
var cors = require("cors");
var fs = require("fs");
var bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
//import * as Searcher from "./SearchCode.js"

const app = express();

app.use(cors());
app.use(bodyParser.json());

// var cookieParser = require("cookie-parser");
// app.use(cookieParser());

const port = "8081";
const host = "localhost";
// MongoDB
const url = "mongodb://127.0.0.1:27017";
const dbName = "final";
const collections = ["UserData", "UserLists"];

const col = { data: "UserData", lists: "UserLists", uL: "ULists" };
const client = new MongoClient(url);
const db = client.db(dbName);
//test
const test = true;

app.listen(port, () => {
  console.log("App listening at http://%s:%s", host, port);
});

app.post("/createAccount", async (req, res) => {
  var space;
  try {
    await client.connect();
    const keys = Object.keys(req.body);
    const values = Object.values(req.body);
    hashCode = (s) =>
      s.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);

    // testing
    console.log(hashCode(values[0] + values[1]));

    const newDocument = {
      username: values[0], // also "id": req.body.username,
      password: values[1], // also "name": req.body.password,
      uKey: hashCode(values[0] + values[1]),
      theme: "default",
      pfp: "https://i1.rgstatic.net/ii/profile.image/660631946547200-1534518338520_Q512/Abraham-Aldaco.jpg",
    };
    user = values[0];
    await fetch(`http://127.0.0.1:8081/checkUserNames/${user}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("does it exist :", data);
        space = data;
      });
    console.log(newDocument);
    // Get the user list and check is user name is taken first
    if (space) {
      const results = await db.collection("UserData").insertOne(newDocument);
      const listsDoc = {
        uKey: hashCode(values[0] + values[1]),
        username:values[0],
        movies: [], // Initialize with an empty array
        planning: [],
        complete: [],
        favorites: []
    
      };
      const list = await db.collection("UserLists").insertOne(listsDoc);
      res.status(200);
      res.send(results);
    } else {
      res.status(500);
      res.send({ error: "The username submitted already exists" });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send({ error: "An internal server error occurred" });
  }
});

app.get("/getUserByUsername/:username", async (req, res) => {
  const username = req.params.username;

  try {
      await client.connect();
      const query = { username: username };
      const userData = await db.collection("UserData").findOne(query);

      if (userData) {
          res.status(200).json(userData);
      } else {
          res.status(404).send({ message: "User not found" });
      }
  } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send({ error: "An internal server error occurred" });
  } finally {
      await client.close();
  }
});

app.put("/updateUser/:uKey", async (req, res) => {
    const oldUKey = parseInt(req.params.uKey);
    const { username, password, pfp } = req.body;

   
    const hashCode = (s) => s.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
    }, 0);

    const newUKey = hashCode(username + password);  // new uKey

    try {
        await client.connect();
        const db = client.db(dbName);
        const userDataCollection = db.collection("UserData");
        const userListsCollection = db.collection("UserLists");

        // Update user document in UserData collection
        const userUpdateResult = await userDataCollection.updateOne(
            { uKey: oldUKey },
            { $set: { username: username, password: password, pfp: pfp, uKey: newUKey } }
        );

        // Update user's uKey in UserLists collection if the UserData update was successful
        if (userUpdateResult.modifiedCount > 0) {
            const listsUpdateResult = await userListsCollection.updateOne(
                { uKey: oldUKey },
                { $set: { uKey: newUKey } }
            );

            if (listsUpdateResult.modifiedCount > 0) {
                res.status(200).send({ message: "User and lists updated successfully" });
            } else {
                res.status(404).send({ error: "Failed to update user lists" });
            }
        } else {
            res.status(404).send({ error: "User not found or no changes made" });
        }
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send({ error: "An internal server error occurred" });
    } finally {
        await client.close();
    }
});

app.get("/checkUserNames/:user", async (req, res) => {
  const user = String(req.params.user);
  await client.connect();
  console.log("Node connected successfully to GET MongoDB");
  const query = { username: user };
  const projection = { _id: 0, username: 1 };

  const foundData = await db
    .collection("UserData")
    .find(query)
    .project(projection)
    .limit(100)
    .toArray();

  if (test == true) {
    testQuery(query, projection, col.data);
  }

  res.status(200);
  res.send(foundData.length == 0);
});

app.get("/login/:id", async (req, res) => {
  const uKey = Number(req.params.id);
  await client.connect();
  console.log("Node connected successfully to GET MongoDB");
  const query = { uKey: uKey };
  //const projection = { _id: 0, uKey: 1, theme : 1 , pfp : 1};

  const foundData = await db
    .collection("UserData")
    .find(query)
    //.project(projection)
    .limit(100)
    .toArray();
  if (test == true) {
    const testData1 = await db
      .collection("UserData")
      .find(query)
      .limit(100)
      .toArray();

    console.log("send data: " + uKey);
    console.log("foundData: ");
    console.log(foundData);
    console.log("t1: (query, no proj)");
    console.log(testData1);
  }
  res.status(200);
  res.send(foundData);
});

app.put("/addToWatchList/:uKey/:listType", async (req, res) => {
    const uKey = Number(req.params.uKey);
    const listType = req.params.listType; // 'planning', 'complete', or 'favorites'
    const imdbID = req.body.imdbID;
    const rating = req.body.rating || "";
    const rewatch = req.body.rewatch || "0";
    const notes = req.body.notes || "";

    const newMovie = {
        imdbID: imdbID,
        rating: rating,
        rewatch: rewatch,
        notes: notes
    };

    try {
        await client.connect();

        // Check if the movie already exists in any list
        const userLists = await db.collection("UserLists").findOne({ uKey: uKey });
        const movieExists = ['planning', 'complete', 'favorites'].some(list =>
            userLists[list] && userLists[list].some(movie => movie.imdbID === imdbID));

        if (movieExists) {
            res.status(409).send({ message: "Movie already exists in one of the lists." });
            return;
        }

        // Add the movie if it does not exist
        const update = { $push: { [listType]: newMovie } };
        const results = await db.collection("UserLists").updateOne({ uKey: uKey }, update);
        res.status(200).send(results);
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send({ error: "An internal server error occurred" });
    } finally {
        await client.close();
    }
});

app.get("/getLists/:uKey", async (req, res) => {
    const uKey = Number(req.params.uKey);
    try {
      await client.connect();
      const foundData = await db.collection("UserLists").findOne({ uKey: uKey }, { projection: {_id: 0, movies: 1, lists: 1} });
      if (foundData) {
        res.status(200).send(foundData);
      } else {
        console.error("No List Was Found");
        res.status(404).send({ message: "List not found" });
      }
    } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send({ error: "An internal server error occurred" });
    }
  });

app.get("/isMovieOnList/:uKey/:imdbID", async (req, res) => {
let thatList;
  try {
    const uKey = Number(req.params.uKey);
    const imdbID = String(req.params.imdbID);

    await client.connect();
    await fetch(`http://127.0.0.1:8081/getLists/${uKey}`)
      .then((response) => response.json())
      .then((data) => {
        thatList = data;
      });
    // if (test == true) {
    //   await testQuery(query, projection, col.uL);
    // }
    console.log("thatList");
    console.log(thatList);
    if (
      thatList.length != 0 &&
      thatList[0].length != 0 &&
      thatList[0].movies.length != 0 &&
      thatList[0].movies[imdbID] != null &&
      thatList[0].movies[imdbID].length != 0
    ) {
      console.log("there is a the list");
      console.log(thatList[0].movies[imdbID]);
      res.status(200);
      res.send(true);
    } else {
      console.error("No List Was Found :)");
      res.status(200);
      res.send(false);
    }
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).send({ error: "An internal server error occurred" });
  }
});

app.get('/userProfile/:uKey', async (req, res) => {
  try {
      await client.connect();
      const uKey = parseInt(req.params.uKey);

      const userData = await db.collection('UserData').findOne({ uKey });
      const userLists = await db.collection('UserLists').findOne({ uKey });

      if (!userData || !userLists) {
          res.status(404).send({ message: 'User or list not found' });
          return;
      }
      const timeWatched = sumTimeWatched(userLists.complete);
      console.log(timeWatched);
      let daysWatched = ((timeWatched/60)/24);//cut to only .1 precision
      const avgScore = sumAverageScore(userLists.complete);
      console.log(avgScore);
      const userProfileData = {
          username: userData.username,
          pfp: userData.pfp,
          theme: userData.theme,
          stats: {
              daysWatched: '7', // placehold TO DO
              averageScore: '7.75' //TO DO
          },
          planning: userLists.planning, 
          complete: userLists.complete,
          favorites: userLists.favorites 
      };

      res.status(200).json(userProfileData);
  } catch (error) {
      console.error('Failed to fetch user profile data:', error);
      res.status(500).send({ error: 'An internal server error occurred' });
  } finally {
      await client.close();
  }
});

app.get('/viewProfile/:username', async (req, res) => {
  try {
      await client.connect();
      const username = String(req.params.username);

      const userData = await db.collection('UserData').findOne({ username });
      const userLists = await db.collection('UserLists').findOne({ username });

      if (!userData || !userLists) {
          res.status(404).send({ message: 'User or list not found' });
          return;
      }
      const timeWatched = sumTimeWatched(userLists.complete);
      let daysWatched = ((timeWatched/60)/24);//cut to only .1 precision
      const avgScore = sumAverageScore(userLists.complete);
      const userProfileData = {
          username: userData.username,
          pfp: userData.pfp,
          theme: userData.theme,
          stats: {
              daysWatched: '7', // placehold TO DO
              averageScore: '7.75' //TO DO
          },
          planning: userLists.planning, 
          complete: userLists.complete,
          favorites: userLists.favorites 
      };
      res.status(200).json(userProfileData);
  } catch (error) {
      console.error('Failed to fetch user profile data:', error);
      res.status(500).send({ error: 'An internal server error occurred' });
  } finally {
      await client.close();
  }
});

function sumAverageScore (watchedList) {
  let avg = 0;
  for (let i = 0; i < watchedList.length; i++) {
    avg += watchedList[i].rating; 
  }
  return(avg/watchedList.length);
}
function sumTimeWatched (watchedList) {
  let sum = 0;
  for (let i = 0; i < watchedList.length; i++) {
    sum += watchedList[i].runtime * (watchedList[i].rewatch +1); 
  }
  return(sum);
}

app.delete("/deleteFromList/:uKey/:listType/:imdbID", async (req, res) => {
    const uKey = Number(req.params.uKey);
    const listType = req.params.listType;
    const imdbID = req.params.imdbID;

    try {
        await client.connect();

        // Pull the movie from the specified list if it exists
        const update = {
            $pull: {
                [listType]: { imdbID: imdbID }
            }
        };
        const results = await db.collection("UserLists").updateOne({ uKey: uKey }, update);

        if (results.modifiedCount === 0) {
            res.status(404).send({ message: "Movie not found in the list or wrong list type." });
        } else {
            res.status(200).send({ message: "Movie successfully deleted from the list." });
        }
    } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send({ error: "An internal server error occurred" });
    } finally {
        await client.close();
    }
});

app.put("/clearList/:uKey/:listType", async (req, res) => {
  const uKey = Number(req.params.uKey);
  const listType = req.params.listType;

  try {
      await client.connect();
      const update = {
          $set: {
              [listType]: [] // Emptyyyyy list
          }
      };
      const results = await db.collection("UserLists").updateOne({ uKey: uKey }, update);

      if (results.modifiedCount === 0) {
          res.status(404).send({ message: "No changes made, possibly because Aldaco ate the server." });
      } else {
          res.status(200).send({ message: "List cleared successfully." });
      }
  } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send({ error: "Server is on fire" });
  } finally {
      await client.close();
  }
});

app.delete("/deleteAccount/:uKey", async (req, res) => {
  const uKey = Number(req.params.uKey);

  try {
      await client.connect();

      const deleteUser = await db.collection("UserData").deleteOne({ uKey: uKey });
   
      const deleteLists = await db.collection("UserLists").deleteOne({ uKey: uKey });

      if (deleteUser.deletedCount === 1 && deleteLists.deletedCount === 1) {
          res.status(200).send({ message: "Account successfully eaten by Declan." });
      } else if (deleteUser.deletedCount === 0 && deleteLists.deletedCount === 0) {
          res.status(404).send({ error: "User not found." });
      } else {
          res.status(500).send({ error: "Maybe it's deleted, maybe it's not" });
      }
  } catch (error) {
      console.error("An error occurred:", error);
      res.status(500).send({ error: "Server eroorrr" });
  } finally {
      await client.close();
  }
});

async function testQuery(query, projection, collect) {
  console.log("in test");
  const foundData = await db
    .collection(collect)
    .find(query)
    .project(projection)
    .limit(100)
    .toArray();
  const testData1 = await db
    .collection(collect)
    .find(query)
    .limit(100)
    .toArray();
  const testData2 = await db
    .collection(collect)
    .find()
    .project(projection)
    .limit(100)
    .toArray();
  const testData3 = await db.collection(collect).find().limit(100).toArray();

  console.log(query);
  console.log(projection);
  console.log("foundData: ");
  console.log(foundData);
  console.log("t1: (query, no proj)");
  console.log(testData1);
  console.log("t2: (no query, proj)");
  console.log(testData2);
  console.log("t3: (no query, no proj)");
  console.log(testData3);
  console.log("send data: " + (foundData.length == 0));
  console.log("tests end");
}