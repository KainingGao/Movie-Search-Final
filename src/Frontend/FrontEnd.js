import { createContext, useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import pfpNotFound from "./images/pfp_not_found.png";

import "bootstrap/dist/css/bootstrap.css";

import * as themes from "./themes.js";
import authorData from "./authors.json";
import author1Photo from "./images/declan2.jpg"
import author2Photo from "./images/kaining2.png"
import "./StyleGuide.css";
//import "./Profile.css";
import * as MovDetails from "./ReactMoviePage.js";

//this is for I can access uKey as user.uKey in the whole app
const UserContext = createContext(null);
const useUser = () => useContext(UserContext);
function UserProvider({ children }) {
  const [user, setUser] = useState({ uKey: null, userInfo: {} });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

//theme "set" function, idk
(function () {
  if (localStorage.getItem("theme") === "site-theme-dark") {
    themes.setTheme("site-theme-dark");
  } else {
    themes.setTheme("site-theme-light");
  }
})();
//hash code maker to easier manage data
function hashCode(s) {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}
let search_hide;
let lockFooter;

function FrontEnd() {
  const [movieCode, setMovieCode] = useState("");
  const [userInfo, setUserInfo] = useState([
    {
      username: "",
      password: "",
      uKey: "",
      theme: "",
      pfp: "",
    },
  ]);

  const SearchMovie = () => {
    // Define hooks
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [movies, setMovies] = useState([
      {
        Poster: "",
        Title: "",
        Type: "",
        Year: "",
        imdbID: "",
      },
    ]);
    if (movies[0].Poster == "") {
      search_hide = 1;
      lockFooter = 1;
    }
    //let searchListEl = document.getElementById("search-list");
    // useEffect to load catalog once HOOK id is modified
    useEffect(() => {
      if (search && search.length > 0) {
        search_hide = 0;
        lockFooter = 0;
        console.log(search);
        fetch(`https://omdbapi.com/?s=${search}&page=1&apikey=616122f3`)
          .then((response) => response.json())
          .then((data) => {
            if (data.Response == "True") {
              console.log(data.Search);
              setMovies(data.Search);
            }
          });
      } else {
        search_hide = 1;
        lockFooter = 1;
      }
    }, [search]); // Fetch only when id changes

    const movieCards = movies.map((el) => (
      <div
        key={el.Year}
        id={el.imdbID}
        className="card shadow-sm content-zone search-item-thumbnail search-list-item"
      >
        <a
          onClick={() => (
            setMovieCode(el.imdbID), navigate(`/moviePage/${el.imdbID}`)
          )}
        >
          <img src={el.Poster} className="card-img-top" alt="..."></img>
        </a>
        <div className="card-body">
          <p className="card-text text">
            {" "}
            <strong>{el.Title}</strong>, {el.Year}
          </p>
          <div className="d-flex justify-content-between align-items-center"></div>
        </div>
      </div>
    ));
    return (
      <>
        {/* Buttons to show CRUD */}

        <div className={"wrapper" + (search_hide == 1 ? " footer-bump" : "")}>
          {/* Show all products using map */}
          {/* <!-- search container --> */}
          <div className="search-container">
            <div className="search-element">
              <h3 className="text">Search Movie:</h3>
              <input
                type="text"
                className="form-control thing"
                placeholder="Search Movie Title ..."
                id="movie-search-box"
                onKeyUp={(e) => setSearch(e.target.value)}
                onClick={(e) => setSearch(e.target.value)}
                // onChange={(e) => setSearch(e.target.value)}
              />
              {/* <!-- on load, from JSON top movies ??? --> */}
              <div className="album py-5 bg-body-tertiary">
                <div className="container">
                  <div className={"search-list"} id="search-list">
                    <div
                      id="col"
                      className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3"
                    >
                      {search_hide == 0 ? movieCards : ""}
                    </div>
                  </div>
                </div>
              </div>
              {/* <!-- list here --> */}
            </div>
          </div>
          {/* <!-- end of search container --> */}
        </div>
      </>
    );
  };
  //
  //

  // Gap to find

  //
  //
  const MoviePage = () => {
    console.log(movieCode);
    const location = useLocation();
    const { user } = useUser();
    // Define hooks
    const navigate = useNavigate();
    const [movie, setMovie] = useState({
      imdbID: location.pathname.split("/").pop(),
      rewatches: "4",
      rating: "2",
    });
    lockFooter = 0;
    console.log(location);
    //setMovie(location.pathname.split("/").pop());

    MovDetails.LoadData();
    //MovDetails.LoadData();

    const handleDelete = async (listType) => {
      if (!user.uKey) {
        alert("You must be logged in to delete movies from your lists.");
        return;
      }
      console.log("before delete check" + user.uKey + listType + movie.imdbID);
      try {
        const response = await fetch(
          `http://127.0.0.1:8081/deleteFromList/${user.uKey}/${listType}/${movie.imdbID}`,
          {
            method: "DELETE",
          }
        );
        const data = await response.json();
        if (response.ok) {
          alert("Movie removed successfully!");
        } else {
          alert(data.message);
        }
      } catch (error) {
        console.error("Failed to delete movie:", error);
        alert("Failed to delete movie."); // Fallback error message
      }
    };

    const handleAddToList = async (listType) => {
      if (!user.uKey) {
        alert("You must be logged in to add movies to your lists.");
        return;
      }

      const url = `http://127.0.0.1:8081/addToWatchList/${user.uKey}/${listType}`;
      const movieData = {
        imdbID: movie.imdbID,
        rating: movie.rating,
        rewatch: movie.rewatches,
        notes: movie.notes,
      };

      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(movieData),
        });
        const data = await response.json();
        if (data) {
          alert(`Movie was added to your ${listType} list`);
        } else {
          alert("Failed to add movie to list.");
        }
      } catch (error) {
        console.error("Error adding movie to list:", error);
        alert("Error adding movie to list: " + error.message);
      }
    };

    return (
      <>
        {/* Buttons to show CRUD */}

        <div class="container my-5 nav-bar-bump background">
          <div class="row p-4 pb-0 pe-lg-0 pt-lg-5 align-items-center rounded-3 shadow-lg content-zone">
            <div class="col-lg-4  overflow-hidden">
              <img
                id="movie-poster"
                class="rounded-lg-3"
                src="./images/image_not_found.png"
                alt=""
              ></img>
            </div>
            <div class="col-lg-7 p-3 p-lg-5 pt-lg-3">
              <h1 id="movie-title" class="display-4 fw-bold lh-1 title">
                rah
              </h1>
              <p id="movie-summary" class="lead summary subtext">
                Summary for movie ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~
                ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~
                ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~ ~~~~~
              </p>
              <p></p>
              <div class="d-grid gap-2 d-md-flex justify-content-md-start mb-4 mb-lg-3">
                <div id="movie-IMDB" class="px-4 me-md-2 subtext">
                  Primary
                </div>
                <div id="movie-RTM" class="px-4 me-md-2 subtext">
                  Default
                </div>
                <div id="movie-Metacritic" class="px-4 me-md-2 subtext">
                  Default
                </div>
              </div>
              <p id="movie-Review" class="lead summary"></p>
              <p></p>
              <div className="d-grid gap-2 d-md-flex justify-content-md-start mb-4 mb-lg-3">
                <button
                  className="btn btn-primary"
                  onClick={() => handleAddToList("planning")}
                >
                  Add to Planning
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleAddToList("complete")}
                >
                  Add to Complete
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleAddToList("favorites")}
                >
                  Add to Favorites
                </button>
              </div>
              <div className="d-grid gap-2 d-md-flex justify-content-md-start mb-4 mb-lg-3">
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete("planning")}
                >
                  Remove from Planning
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete("complete")}
                >
                  Remove from Complete
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete("favorites")}
                >
                  Remove from Favorites
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="album py-5 bg-body-tertiary">
          <div class="container">
            {/* number of slots  gap */}
            <div
              id="crew"
              class="row row-cols-1 row-cols-sm-4 row-cols-md-4 g-4s"
            >
              <div class="col">
                <div class="card shadow-sm">
                  <img
                    id="director-image"
                    scr="./images/image_not_found.png"
                    alt="director"
                  ></img>
                  <div class="card-body">
                    <p class="card-text cast-text">
                      <strong>Director</strong>
                    </p>
                    <p id="director-text" class="card-price"></p>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="card shadow-sm">
                  <img
                    id="actor0-image"
                    scr="./images/image_not_found.png"
                    alt="cast0"
                  />
                  <div class="card-body cast-text">
                    <p class="card-text">
                      <strong>Actor</strong>
                    </p>
                    <p id="actor0-text" class="card-price"></p>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="card shadow-sm">
                  <img
                    id="actor1-image"
                    scr="./images/image_not_found.png"
                    alt="cast1"
                  />
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Actor1</strong>
                    </p>
                    <p id="actor1-text" class="card-price"></p>
                  </div>
                </div>
              </div>

              <div class="col">
                <div class="card shadow-sm">
                  <img
                    id="actor2-image"
                    scr="./images/image_not_found.png"
                    alt="cast2"
                  />
                  <div class="card-body">
                    <p class="card-text">
                      <strong>Actor3</strong>
                    </p>
                    <p id="actor2-text" class="card-price"></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  //
  //
  //
  //
  //
  const SignUp = () => {
    // Define hooks
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [userData, setUserData] = useState([
      {
        username: "",
        password: "",
        uKey: "",
      },
    ]);
    const [formData, setFormData] = useState({
      username: "",
      password: "",
    });
    lockFooter = 1;
    // Function to add input in formData HOOK using operator ...
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    };
    // Function to fetch backend for POST - it sends data in BODY
    const handleSubmit = (e) => {
      e.preventDefault();
      console.log(e.target.value);
      fetch("http://127.0.0.1:8081/createAccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (response.status != 200) {
            return response.json().then((errData) => {
              throw new Error(
                `POST response was not ok :\n Status:${response.status}. \n Error: ${errData.error}`
              );
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log(data);
          alert("User added successfully!");
        })
        .catch((error) => {
          console.error("Error adding user:", error);
          alert("Error adding user:" + error.message); // Display alert if there's an error
        });
    }; // end handleOnSubmit
    //return
    return (
      <>
        {/* Form to input data */}
        <br></br>
        <br></br>

        <div className="container mt-5">
          <h1 className="text-center mb-4 text">Sign Up</h1>
          <h4 className="text-center mb-4 text">
            DON'T USE REAL PASSWORDS AS THIS SITE IS NOT SECURE
          </h4>
          <form onSubmit={handleSubmit} className="mt-3">
            <label className="text" for="username">
              Username: (3-16 characters)
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="form-control mb-3"
              pattern="\w{3,16}"
              required
            />
            <label className="text" for="password">
              Password: (3-16 characters)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="form-control mb-3"
              pattern="\w{3,16}"
              required
            />
            <button type="submit" className="btn btn-success">
              Submit
            </button>
          </form>
        </div>
      </>
    );
  };

  const Login = () => {
    const { setUser } = useUser();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      const hashKey = hashCode(formData.username + formData.password);
      try {
        const response = await fetch(`http://127.0.0.1:8081/login/${hashKey}`);
        const data = await response.json();
        if (data.length) {
          alert("You have Logged in to user: " + data[0].username);
          setUser({ uKey: data[0].uKey, userInfo: data[0] });
          navigate(`/profile/${data[0].username}`);
        } else {
          alert("Login failed.");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("Login error: " + error.message);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="container mt-5 text-light">
        <br></br>
        <h1 className="text-center mb-4 text">Login</h1>
        <div className="mb-3">
          <label htmlFor="username" className="form-label text">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="form-control"
            id="username"
            placeholder="Enter your username"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label text">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-control"
            id="password"
            placeholder="Enter your password"
            pattern="\w{3,16}"
            required
          />
        </div>
        <br></br>
        <button type="submit" className="btn btn-success btn-lg btn-block">
          Submit
        </button>
      </form>
    );
  };

  //
  //
  //
  //
  //

  const UserProfile = () => {
    const navigate = useNavigate();

    const { user, setUser } = useUser();
    const [userData, setUserData] = useState({
      username: "",
      pfp: "",
      theme: "",
      stats: {
        daysWatched: "",
        averageScore: "",
      },
      planning: [],
      complete: [],
      favorites: [],
    });
    lockFooter = 0;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!user || !user.uKey) {
        alert("Please Login First!");
        navigate("/login");
        return;
      }
    });

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [pfp, setPfp] = useState("");
    const [showForm, setShowForm] = useState(false); //this form is for editUserProfile
    const toggleForm = () => setShowForm(!showForm);

    const handleUpdate = async (e) => {
      e.preventDefault();

      console.log("Updating profile with:", { username, password, pfp });

      const response = await fetch(
        `http://localhost:8081/updateUser/${user.uKey}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            pfp,
          }),
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        alert("Profile updated successfully!");
        alert("Please Re-login");
        setUser({ uKey: null }); //this is equaling to logged out
        navigate("/login");
      } else {
        alert(`Failed to update profile: ${data.error}`);
      }
    };

    const fetchData = async () => {
      if (user.uKey) {
        try {
          const response = await fetch(
            `http://127.0.0.1:8081/userProfile/${user.uKey}`
          );
          const data = await response.json();
          if (response.ok) {
            // Handle initial data fetch
            await fetchMovieDetails(data);
          } else {
            throw new Error("Failed to fetch user data: " + data.message);
          }
        } catch (err) {
          setError(err.message);
          console.error("Error fetching user data:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    useEffect(() => {
      fetchData();
    }, [user.uKey]);

    const clearList = async (listName) => {
      if (
        window.confirm(`Are you sure you want to clear your ${listName} list?`)
      ) {
        const response = await fetch(
          `http://localhost:8081/clearList/${user.uKey}/${listName}`,
          {
            method: "PUT",
          }
        );
        const result = await response.json();
        if (response.ok) {
          fetchData(); //refresh the page
        } else {
          alert("Failed to clear list: " + result.error);
        }
      }
    };

    const deleteAccount = async () => {
      if (
        window.confirm(
          "Sure deleting your account? Aldaco can't even ctrl-z it"
        )
      ) {
        const response = await fetch(
          `http://localhost:8081/deleteAccount/${user.uKey}`,
          {
            method: "DELETE",
          }
        );
        const result = await response.json();
        if (response.ok) {
          alert("Your account has been deleted.");
          setUser({ uKey: null });
          navigate("/login");
        } else {
          alert("Failed to delete account: " + result.error);
        }
      }
    };

    const fetchMovieDetails = async (data) => {
      // Fetch movie details for each list
      const movieLists = ["planning", "complete", "favorites"];
      for (let list of movieLists) {
        const moviesWithDetails = await Promise.all(
          data[list].map(async (movie) => {
            const res = await fetch(
              `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=616122f3`
            );
            const details = await res.json();
            return {
              ...movie,
              title: details.Title,
              poster: details.Poster,
              year: details.Year,
            };
          })
        );
        data[list] = moviesWithDetails;
      }
      setUserData({
        username: data.username,
        pfp: data.pfp,
        theme: data.theme,
        stats: data.stats,
        planning: data.planning,
        complete: data.complete,
        favorites: data.favorites,
      });
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;
    return (
      <div className="container mt-3 text-light">
        <br></br>
        <br></br>
        <br></br>
        <div className="row align-items-start">
          <div className="col-md-4">
            <img
              src={userData.pfp || "./path/to/default/profile.png"}
              alt="Profile"
              className="img-thumbnail"
            />
          </div>
          <div className="col-md-8 text">
            <div className=" d-flex justify-content-between align-items-center btn-sm">
              <h1>{userData.username}</h1>
              <button className="btn btn-danger" onClick={deleteAccount}>
                Delete Account
              </button>
            </div>
            <div>
              <p>Days Watched: {userData.stats.daysWatched}</p>
              <p>Average Score: {userData.stats.averageScore}/10</p>
              <div className="container mt-5">
                <button onClick={toggleForm} className="btn btn-primary">
                  {showForm ? "Cancel Edit" : "Edit Profile"}
                </button>
                {showForm && (
                  <form onSubmit={handleUpdate} className="mt-3">
                    <div className="mb-3">
                      <label htmlFor="username" className="form-label">
                        Username:
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="form-control"
                        pattern="\w{3,16}"
                        id="username"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">
                        Password:
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-control"
                        pattern="\w{3,16}"
                        id="password"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="pfp" className="form-label">
                        Profile Picture URL:
                      </label>
                      <input
                        type="text"
                        value={pfp}
                        onChange={(e) => setPfp(e.target.value)}
                        className="form-control"
                        id="pfp"
                      />
                    </div>
                    <button type="submit" className="btn btn-success">
                      Update Profile
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Planning</h2>
            <button
              className="btn btn-outline-warning btn-sm"
              onClick={() => clearList("planning")}
            >
              Clear
            </button>
          </div>
          <div className="row">
            {userData.planning.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Complete</h2>
            <button
              className="btn btn-outline-warning btn-sm"
              onClick={() => clearList("complete")}
            >
              Clear
            </button>
          </div>
          <div className="row">
            {userData.complete.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Favorites</h2>
            <button
              className="btn btn-outline-warning btn-sm"
              onClick={() => clearList("favorites")}
            >
              Clear
            </button>
          </div>
          <div className="row">
            {userData.favorites.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  const ViewProfile = () => {
    const navigate = useNavigate();

    let viewPath = useLocation().pathname.split("/")[3];
    console.log(viewPath);
    const { user, setUser } = useUser();
    const [viewData, setViewData] = useState({
      username: "",
      pfp: "",
      theme: "",
      stats: {
        daysWatched: "",
        averageScore: "",
      },
      planning: [],
      complete: [],
      favorites: [],
    });
    lockFooter = 0;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!viewPath || viewPath == "") {
        alert("Please Enter A UserName!");
        navigate("/search");
        return;
      }
    });

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [pfp, setPfp] = useState("");
    const [showForm, setShowForm] = useState(false); //this form is for editUserProfile
    const toggleForm = () => setShowForm(!showForm);

    const fetchData = async () => {
      if (viewPath) {
        try {
          const response = await fetch(
            `http://127.0.0.1:8081/viewProfile/${viewPath}`
          );
          const data = await response.json();
          if (response.ok) {
            // Handle initial data fetch
            await fetchMovieDetails(data);
          } else {
            throw new Error("Failed to fetch user data: " + data.message);
          }
        } catch (err) {
          setError(err.message);
          console.error("Error fetching user data:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    useEffect(() => {
      fetchData();
    }, [viewPath]);

    const fetchMovieDetails = async (data) => {
      // Fetch movie details for each list
      const movieLists = ["planning", "complete", "favorites"];
      for (let list of movieLists) {
        const moviesWithDetails = await Promise.all(
          data[list].map(async (movie) => {
            const res = await fetch(
              `https://www.omdbapi.com/?i=${movie.imdbID}&apikey=616122f3`
            );
            const details = await res.json();
            return {
              ...movie,
              title: details.Title,
              poster: details.Poster,
              year: details.Year,
            };
          })
        );
        data[list] = moviesWithDetails;
      }
      setViewData({
        username: data.username,
        pfp: data.pfp,
        theme: data.theme,
        stats: data.stats,
        planning: data.planning,
        complete: data.complete,
        favorites: data.favorites,
      });
    };

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">Error: {error}</p>;
    return (
      <div className="container mt-3 text-light">
        <br></br>
        <br></br>
        <br></br>
        <div className="row align-items-start">
          <div className="col-md-4">
            <img
              src={viewData.pfp || "./path/to/default/profile.png"}
              alt="Profile"
              className="img-thumbnail"
            />
          </div>
          <div className="col-md-8 text">
            <div className=" d-flex justify-content-between align-items-center btn-sm">
              <h1>{viewData.username}</h1>
            </div>
            <div>
              <p>Days Watched: {viewData.stats.daysWatched}</p>
              <p>Average Score: {viewData.stats.averageScore}/10</p>
            </div>
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Planning</h2>
          </div>
          <div className="row">
            {viewData.planning.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Complete</h2>
          </div>
          <div className="row">
            {viewData.complete.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card mt-3 text-light">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Favorites</h2>
          </div>
          <div className="row">
            {viewData.favorites.map((movie) => (
              <div
                key={movie.imdbID}
                className="col-sm-6 col-md-4 col-lg-3 mb-3"
              >
                <div
                  className="card h-100"
                  onClick={() => navigate(`/MoviePage/${movie.imdbID}`)}
                >
                  <img
                    src={movie.poster}
                    className="card-img-top"
                    alt={movie.title}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{movie.title}</h5>
                    <p className="card-text">{movie.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Authors = () => {
    return (
      <>
        <div class="container nav-bar-bump">
          <div class="authors-row">
          <div class="author-card">
          <div class="author-info">
              <img src={author1Photo} alt={authorData.posts[0].name} class="author-img"></img>
              <h2 className="text">{authorData.posts[0].name}</h2>
              <p className="text">{authorData.posts[0].role}</p>
              <p className="text">{authorData.posts[0].bio}</p>
              <p class="subtext">{authorData.posts[0].class}</p>
              <p class="subtext">Our teacher is, Dr. Abraham N. Aldaco Gastelum, aaldaco@iastate.edu</p>
              <p class="subtext">The other teacher is, Dr. Ali Jannesar, jannesar@iastate.edu</p>
              <p class="subtext">I can be found at, {authorData.posts[0].contact}</p>
              <p class="subtext">I last worked on this site {authorData.posts[0].date}</p>
          </div>
      </div>
          </div>
        </div>
      
      <div class="container">
          <div class="authors-row">
          <div class="author-card">
          <div class="author-info">
              <img src={author1Photo} alt={authorData.posts[1].name} class="author-img"></img>
              <h2 className="text">{authorData.posts[1].name}</h2>
              <p className="text">{authorData.posts[1].role}</p>
              <p className="text">{authorData.posts[1].bio}</p>
              <p class="subtext">{authorData.posts[1].class}</p>
              <p class="subtext">Our teacher is, Dr. Abraham N. Aldaco Gastelum, aaldaco@iastate.edu</p>
              <p class="subtext">The other teacher is, Dr. Ali Jannesar, jannesar@iastate.edu</p>
              <p class="subtext">I can be found at, {authorData.posts[1].contact}</p>
              <p class="subtext">I last worked on this site {authorData.posts[1].date}</p>
          </div>
      </div>
          </div>
        </div>
      </>
    );
  };
  const Attributions = () => {
    return <>
    <div class="container">
      <div class="container my-5 nav-bar-bump background">

        <div class="row mb-3 text-center content-zone">
          <div class="col-md-4 themed-grid-col">
            <div class="pb-3 content-zone">
              <a onmouseover="mouseOver()" onmouseout="mouseOut()" id="link" class="active" href="https://www.omdbapi.com/"><strong>OMDb API</strong></a>
            </div>
            <div class="row">
              <div class="col-md-12 themed-grid-col text">
                <a class="nav-link active" aria-current="page" href="./index.html">Search</a>
              </div>
            </div>
            <div class="row">
              <div class="col-md-12 themed-grid-col text">
                <a class="nav-link active" href="./moviePage.html#tt0073195">Movie Page</a>
              </div>
            </div>
          </div>
          <div class="col-md-8 themed-grid-col attributions-boxes content-zone">Used for movie search, and fill in all the info on the specific movie</div>
        </div>

        <div class="row mb-3 text-center content-zone">
          <div class="col-md-4 themed-grid-col">
            <div class="pb-3 content-zone">
              <a class="active" href="https://developer.themoviedb.org/docs/getting-started">TMDb API</a>
            </div>
            <div class="row">
              <div class="col-md-12 themed-grid-col text">
                <a class="nav-link active" href="./moviePage.html#tt0073195">Movie Page</a>
              </div>
            </div>
          </div>
          <div class="col-md-8 themed-grid-col attributions-boxes content-zone">Used to get images of directors and actors</div>
        </div>


        <div class="row mb-3 text-center content-zone">
          <div class="col-md-4 themed-grid-col">
            <div class="pb-3 content-zone">
              <a href="https://openai.com/">Open API</a>
            </div>
            <div class="row">
              <div class="col-md-12 themed-grid-col text">
                <a class="nav-link active" href="./g4.html">Ask Ai</a>
              </div>
            </div>
          </div>
          <div class="col-md-8 themed-grid-col attributions-boxes content-zone">Used for movie search based off of description</div>
        </div>
        


      </div>
    </div></>;
  };
  const NavEl = () => {
    const { user } = useUser();
    const navigate = useNavigate();
    const defaultPfp =
      "https://th.bing.com/th/id/OIP.4bFEfLBbGjo85hBIkTwfWAHaHa?rs=1&pid=ImgDetMain";
    console.log(userInfo);
    return (
      <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark header-color">
        <div className="container-fluid">
          <a
            className="navbar-brand nav-link active"
            onClick={() => navigate("/search")}
          >
            Search
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <ul className="navbar-nav me-auto mb-2 mb-md-0">
              <li className="nav-item">
                <button
                  className="nav-link active"
                  onClick={() => navigate("/moviePage/tt0073195")}
                >
                  Movie Page2
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link active"
                  onClick={() => navigate(`/profile/${user.userInfo.username}`)}
                >
                  Profile
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link active"
                  onClick={() => navigate("/signUp")}
                >
                  Sign Up
                </button>
              </li>
              <li className="nav-item">
                <button
                  className="nav-link active"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
              </li>
              <li className="nav-item">
                <img
                  className="nav-link active"
                  width={40}
                  height={40}
                  src={
                    user && user.userInfo && user.userInfo.pfp
                      ? user.userInfo.pfp
                      : defaultPfp
                  }
                />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
  };
  const FooterEl = () => {
    const navigate = useNavigate();

    let page = useLocation().pathname.split("/")[1];
    console.log(page);
    switch (page) {
      case "login":
      case "signUp":
      case "attributions":
        lockFooter = 1;
        break;

      case "search":
      case "moviePage":
      case "profile":
      case "":
        lockFooter = 0;
        break;
      default:
        lockFooter = 0;
        console.log(`Sorry, cant find this page, ${page}.`);
    }
    return (
      <footer
        id="footer"
        class={
          "text-body-secondary mt-auto py-5 footer" +
          (lockFooter == 1 ? " fixed-bottom" : "")
        }
      >
        <div class="container">
          <p class="float-end mb-1">
            <a href="#">Back to top</a>
          </p>
          <button id="switch-light" onClick={() => themes.lightTheme()}>
            Light
          </button>
          <button id="switch-dark" onClick={() => themes.darkTheme()}>
            Dark
          </button>
          <p class="mb-1">Album example is &copy; Bootstrap</p>
          <p class="mb-0">@Declan Fruzyna & Kaining Gao</p>
          <p class="mb-0">Made 2/27/24</p>
          <p class="float-end mb-1">
            <ul>
              <li>
                <a class="text" onClick={() => navigate(`/attributions`)}>
                  attributions
                </a>
              </li>
              <li>
                <a class="text" onClick={() => navigate(`/authors`)}>
                  authors
                </a>
              </li>
            </ul>
          </p>
        </div>
      </footer>
    );
  };
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
            <Route
              path="/search"
              element={
                <>
                  <NavEl />
                  <SearchMovie />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/moviePage/:imdbid"
              element={
                <>
                  <NavEl />
                  <MoviePage />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/profile/:userID"
              element={
                <>
                  <NavEl />
                  <UserProfile />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/view/profile/:userID"
              element={
                <>
                  <NavEl />
                  <ViewProfile />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/profile/profile/:id"
              element={
                <>
                  <NavEl />
                  <UserProfile />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/login"
              element={
                <>
                  <NavEl />
                  <Login />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/signUp"
              element={
                <>
                  <NavEl />
                  <SignUp />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/authors"
              element={
                <>
                  <NavEl />
                  <Authors />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/attributions"
              element={
                <>
                  <NavEl />
                  <Attributions />
                  <FooterEl />
                </>
              }
            />
            <Route
              path="/"
              element={
                <>
                  <NavEl />
                  <SearchMovie />
                  <FooterEl />
                </>
              }
            />{" "}
            {/* Default view */}
          </Routes>
        </Router>
      </div>
    </UserProvider>
  );
}

//themes.setTheme("site-theme-dark");

export default FrontEnd;
