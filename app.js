const form = document.getElementById("addSongForm");
const playlistDiv = document.getElementById("playlist");
const audioPlayer = document.getElementById("audioPlayer");
const totalSongsEl = document.getElementById("totalSongs");
const totalDurationEl = document.getElementById("totalDuration");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

const currentTitleEl = document.getElementById("currentSongTitle");
const currentArtistEl = document.getElementById("currentSongArtist");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const progressFill = document.getElementById("progressFill");

let songs = JSON.parse(localStorage.getItem("songs")) || [];
let currentIndex = -1;
let isPlaying = false;

// ======== Save Songs ========
function saveSongs() {
    localStorage.setItem("songs", JSON.stringify(songs));
}

// ======== Render Playlist ========
function renderPlaylist() {
    playlistDiv.innerHTML = "";
    totalSongsEl.textContent = songs.length;

    let totalSec = songs.reduce((acc, song) => acc + Number(song.duration), 0);
    let min = Math.floor(totalSec / 60);
    let sec = totalSec % 60;
    totalDurationEl.textContent = `${min}:${sec.toString().padStart(2,"0")}`;

    if(songs.length === 0){
        playlistDiv.innerHTML = "<p>No songs added</p>";
        return;
    }

    songs.forEach((song, index)=>{
        const div = document.createElement("div");
        div.className = "song-item";
        div.innerHTML = `
            <strong>${song.title}</strong> - ${song.artist} (${song.duration}s)
            <button onclick="playSong(${index})">Play</button>
        `;
        playlistDiv.appendChild(div);
    });
}

// ======== Play Song ========
function playSong(index){
    currentIndex = index;
    const song = songs[index];
    audioPlayer.src = song.url;
    audioPlayer.play();
    isPlaying = true;
    updateNowPlaying();
}

// ======== Now Playing Info ========
function updateNowPlaying(){
    if(currentIndex === -1){
        currentTitleEl.textContent = "No song selected";
        currentArtistEl.textContent = "";
        currentTimeEl.textContent = "0:00";
        totalTimeEl.textContent = "0:00";
        progressFill.style.width = "0%";
        return;
    }
    const song = songs[currentIndex];
    currentTitleEl.textContent = song.title;
    currentArtistEl.textContent = song.artist;
    totalTimeEl.textContent = formatTime(song.duration);
}

// ======== Format Time ========
function formatTime(seconds){
    let min = Math.floor(seconds / 60);
    let sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2,"0")}`;
}

// ======== Play / Pause ========
playBtn.addEventListener("click", ()=>{
    if(currentIndex === -1 && songs.length>0){
        playSong(0);
        return;
    }
    if(isPlaying){
        audioPlayer.pause();
        isPlaying = false;
    } else {
        audioPlayer.play();
        isPlaying = true;
    }
});

// ======== Next / Prev ========
nextBtn.addEventListener("click", ()=>{
    if(songs.length === 0) return;
    currentIndex = (currentIndex + 1) % songs.length;
    playSong(currentIndex);
});

prevBtn.addEventListener("click", ()=>{
    if(songs.length === 0) return;
    currentIndex = (currentIndex - 1 + songs.length) % songs.length;
    playSong(currentIndex);
});

// ======== Shuffle ========
shuffleBtn.addEventListener("click", ()=>{
    if(songs.length === 0) return;
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random()*songs.length);
    } while(randomIndex === currentIndex && songs.length>1);
    playSong(randomIndex);
});

// ======== Add Song ========
form.addEventListener("submit", function(e){
    e.preventDefault();

    const title = document.getElementById("songTitle").value;
    const artist = document.getElementById("artistName").value;
    const duration = parseInt(document.getElementById("duration").value);
    const file = document.getElementById("musicFile").files[0];

    if(!file){
        alert("Select a music file!");
        return;
    }

    const url = URL.createObjectURL(file);

    songs.push({ title, artist, duration, url });
    saveSongs();
    renderPlaylist();
    form.reset();
});

// ======== Clear All Songs ========
document.getElementById("clearBtn").addEventListener("click", ()=>{
    if(confirm("Are you sure?")){
        songs = [];
        saveSongs();
        renderPlaylist();
        audioPlayer.pause();
        audioPlayer.src = "";
        currentIndex = -1;
        isPlaying = false;
        updateNowPlaying();
        progressFill.style.width = "0%";
    }
});

// ======== Progress Bar ========
audioPlayer.addEventListener("timeupdate", ()=>{
    if(audioPlayer.duration){
        const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = percent + "%";
        currentTimeEl.textContent = formatTime(Math.floor(audioPlayer.currentTime));
    }
});

// ======== Auto Next Song ========
audioPlayer.addEventListener("ended", ()=>{
    nextBtn.click();
});

// ======== Initial Render ========
renderPlaylist();
updateNowPlaying();
