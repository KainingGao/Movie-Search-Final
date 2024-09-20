import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import imageNotFound from "./images/image_not_found.png";

let currentCastURL;

//1
export async function LoadData() {
  const location = useLocation();
  //console.log(location);
  let movieId = location.pathname.split("/").pop(); //gets After  #
  //console.log(movieId);
  const result = await fetch(
    `https://www.omdbapi.com/?i=${movieId}&apikey=616122f3`
  );
  const movieDetails = await result.json();
  console.log(movieDetails);
  if (movieDetails.Response == "True") {
    updateDetails(movieDetails);
  }
}
//2
export function updateDetails(details) {
  updateMovieDetails(details);
  updateDirectorDetails(details);
}
//3
export function updateMovieDetails(details) {
  document.getElementById("movie-title").innerText = `${details.Title}`;
  document.getElementById("movie-poster").src = `${
    details.Poster != "N/A" ? details.Poster : imageNotFound
  }`;
  document.getElementById("movie-summary").innerText = `${details.Plot}`;
  //ratings
  document.getElementById("movie-IMDB").innerText = `IMDB: ${
    details.Ratings.length >= "1" ? details.Ratings[0].Value : "N/A"
  }`;
  document.getElementById("movie-RTM").innerText = `Rotten Tomatoes: ${
    details.Ratings.length >= "2" ? details.Ratings[1].Value : "N/A"
  }`;
  document.getElementById("movie-Metacritic").innerText = `Metacritic: ${
    details.Ratings.length >= "3" ? details.Ratings[2].Value : "N/A"
  }`;
}
//4
export async function updateDirectorDetails(details) {
  var director = details.Director.split(" ");
  await loadCast(director);
  if (currentCastURL == "https://image.tmdb.org/t/p/w500null") {
    currentCastURL = "N/A";
  }
  console.log(currentCastURL);
  document.getElementById(
    "director-text"
  ).innerText = `${(director[0] != null && director[1] != null) ? `${director[0]} ${director[1]}` : ""}`;
  document.getElementById("director-image").src = `${currentCastURL != "N/A"? `${currentCastURL}` : imageNotFound}`;

  //creates cast cards
  var cast = details.Actors.split(",");
  cast[0] = ` ${cast[0]}`;
  console.log(cast);
  let i = 0;
  let max = (cast.length <= 3 ?  cast.length: 3);
  //let actorZone = document.getElementById("actors");
  if (details.Actors != "N/A") {
    for (i = 0; i < max; i++) {
      let actor = cast[i].substring(1).split(" ");
      await loadCast(actor);
      console.log(`${actor[0]} ${actor[1]}`);
      document.getElementById(`actor${i}-text`).innerText = `${(actor[0] != null && actor[1] != null) ? `${actor[0]} ${actor[1]}` : ""}`;
      document.getElementById(`actor${i}-image`).src = (`${currentCastURL != "N/A" ? currentCastURL : imageNotFound}`);
    }
  } else {
    //console.log("N/A input");
    document.getElementById(`actor${0}-text`).innerText = "N/A";
    document.getElementById(`actor${0}-image`).src = imageNotFound;
    document.getElementById(`actor${1}-text`).innerText = "N/A";
    document.getElementById(`actor${1}-image`).src = imageNotFound;
    document.getElementById(`actor${2}-text`).innerText = "N/A";
    document.getElementById(`actor${2}-image`).src = imageNotFound;
  }
}
//5
async function loadCast(details) {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization:
        "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxZmQ0MTYyNDkwNDBhNjM1MzA5ZTJjMmViYmE3MzJiOCIsInN1YiI6IjY1ZDk1ZmI4ZGQ0N2UxMDE3YzI4MDZlNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.87g0A69s11m8xlI87sigWaYOdTDOMQ4zf0nITDG2Ccs",
    },
  };
  //
  await fetch(
    `https://api.themoviedb.org/3/search/person?query=${details[0]}%20${details[1]}&include_adult=false&language=en-US&page=1`,
    options
  )
    .then((response) => response.json())
    .then((response) => loadImage(response))
    .catch((err) => console.error(err));
}

function loadImage(data) {
  //console.log(data);

  if (
    data != null &&
    "results" in data &&
    data.results.length > 0 &&
    "profile_path" in data.results[0] &&
    data.results[0].profile_path != null
  ) {
    currentCastURL = `https://image.tmdb.org/t/p/w500${data.results[0].profile_path}`;
  } else {
    currentCastURL = "N/A";
  }
}