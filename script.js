const playlist = [];
const audio = document.querySelector("audio");

function addSong() {
  const title = document.querySelector("#songTitle").value;
  const artist = document.querySelector("#artist").value;
  const fileInput = document.querySelector("#musicFile");
  const file = fileInput.files[0];

  if (!title || !artist || !file) {
    alert("Please fill all fields");
    return;
  }

  const songURL = URL.createObjectURL(file);

  const song = { title, artist, songURL };
  playlist.push(song);

  renderPlaylist();
  playSong(song);
}

function renderPlaylist() {
  const list = document.querySelector(".playlist");
  list.innerHTML = "";

  playlist.forEach((song, index) => {
    const div = document.createElement("div");
    div.innerText = song.title + " - " + song.artist;
    div.onclick = () => playSong(song);
    list.appendChild(div);
  });
}

function playSong(song) {
  audio.src = song.songURL;
  audio.play();

  document.querySelector(".now-playing").innerText =
    song.title + " - " + song.artist;
}
