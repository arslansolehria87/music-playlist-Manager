// API Base URL
const API_BASE = 'http://localhost:8080/api';

// State
let currentSongId = null;
let songs = [];
let isPlaying = false;

// Sample music URLs (royalty-free music)
const SAMPLE_MUSIC_URLS = [
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
];

// DOM Elements
const addSongForm = document.getElementById('addSongForm');
const playlist = document.getElementById('playlist');
const prevBtn = document.getElementById('prevBtn');
const playBtn = document.getElementById('playBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const clearBtn = document.getElementById('clearBtn');
const totalSongsEl = document.getElementById('totalSongs');
const totalDurationEl = document.getElementById('totalDuration');
const currentSongTitleEl = document.getElementById('currentSongTitle');
const currentSongArtistEl = document.getElementById('currentSongArtist');
const toast = document.getElementById('toast');
const audioPlayer = document.getElementById('audioPlayer');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPlaylist();
    setupEventListeners();
    setupAudioListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    addSongForm.addEventListener('submit', handleAddSong);
    prevBtn.addEventListener('click', handlePrevious);
    playBtn.addEventListener('click', togglePlay);
    nextBtn.addEventListener('click', handleNext);
    shuffleBtn.addEventListener('click', handleShuffle);
    clearBtn.addEventListener('click', handleClear);
    progressBar.addEventListener('click', seekAudio);
}

// Setup Audio Event Listeners
function setupAudioListeners() {
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
    audioPlayer.addEventListener('ended', handleSongEnd);
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        updatePlayButton();
    });
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayButton();
    });
}

// ==================== API CALLS ====================

async function loadPlaylist() {
    try {
        const response = await fetch(`${API_BASE}/songs`);
        songs = await response.json();
        renderPlaylist();
        updateStats();
        updateCurrentSong();
    } catch (error) {
        showToast('Error loading playlist', 'error');
        console.error('Error:', error);
    }
}

async function addSong(title, artist, duration, audioFile) {
    try {
        // Convert audio file to base64
        const audioData = await fileToBase64(audioFile);

        const response = await fetch(`${API_BASE}/songs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title,
                artist,
                duration,
                audioData
            }),
        });
        const data = await response.json();
        if (data.success) {
            showToast(`Added: ${title}`, 'success');
            loadPlaylist();
        }
    } catch (error) {
        showToast('Error adding song', 'error');
        console.error('Error:', error);
    }
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function removeSong(id) {
    try {
        const response = await fetch(`${API_BASE}/songs/${id}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
            showToast('Song removed', 'success');
            loadPlaylist();
        }
    } catch (error) {
        showToast('Error removing song', 'error');
        console.error('Error:', error);
    }
}

async function playNext() {
    try {
        const response = await fetch(`${API_BASE}/player/next`, {
            method: 'POST',
        });
        const data = await response.json();
        if (data.success && data.current) {
            currentSongId = data.current.id;
            updateCurrentSong();
            renderPlaylist();
            showToast(`Now playing: ${data.current.title}`, 'success');
        } else {
            showToast('Already at the last song', 'error');
        }
    } catch (error) {
        showToast('Error playing next song', 'error');
        console.error('Error:', error);
    }
}

async function playPrevious() {
    try {
        const response = await fetch(`${API_BASE}/player/previous`, {
            method: 'POST',
        });
        const data = await response.json();
        if (data.success && data.current) {
            currentSongId = data.current.id;
            updateCurrentSong();
            renderPlaylist();
            showToast(`Now playing: ${data.current.title}`, 'success');
        } else {
            showToast('Already at the first song', 'error');
        }
    } catch (error) {
        showToast('Error playing previous song', 'error');
        console.error('Error:', error);
    }
}

async function shufflePlaylist() {
    try {
        const response = await fetch(`${API_BASE}/player/shuffle`, {
            method: 'POST',
        });
        const data = await response.json();
        if (data.success) {
            showToast('Playlist shuffled!', 'success');
            loadPlaylist();
        }
    } catch (error) {
        showToast('Error shuffling playlist', 'error');
        console.error('Error:', error);
    }
}

async function getCurrentSong() {
    try {
        const response = await fetch(`${API_BASE}/player/current`);
        const data = await response.json();
        if (data && data.id) {
            currentSongId = data.id;
        }
    } catch (error) {
        console.error('Error getting current song:', error);
    }
}

// ==================== EVENT HANDLERS ====================

async function handleAddSong(e) {
    e.preventDefault();

    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('artistName').value.trim();
    const duration = parseInt(document.getElementById('duration').value);
    const musicFile = document.getElementById('musicFile').files[0];

    if (!title || !artist || duration <= 0) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (!musicFile) {
        showToast('Please select a music file', 'error');
        return;
    }

    // Show Upload Modal
    const modal = document.getElementById('uploadModal');
    modal.classList.add('show');

    try {
        await addSong(title, artist, duration, musicFile);
        addSongForm.reset();
    } catch (error) {
        console.error("Upload failed", error);
    } finally {
        // Hide Upload Modal
        setTimeout(() => {
            modal.classList.remove('show');
        }, 500); // Small delay for better UX
    }
}

async function handlePrevious() {
    await playPrevious();
}

async function handleNext() {
    await playNext();
}

async function handleShuffle() {
    if (songs.length < 2) {
        showToast('Need at least 2 songs to shuffle', 'error');
        return;
    }
    await shufflePlaylist();
}

async function handleClear() {
    if (confirm('Are you sure you want to clear the entire playlist?')) {
        // Remove all songs one by one
        for (const song of songs) {
            await removeSong(song.id);
        }
        showToast('Playlist cleared', 'success');
    }
}

async function handlePlaySong(id) {
    currentSongId = id;
    updateCurrentSong();
    renderPlaylist();
    // Play the selected song
    playCurrentSong();
}

// ==================== UI RENDERING ====================

function renderPlaylist() {
    if (songs.length === 0) {
        playlist.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Your playlist is empty</p>
                <p class="empty-state-hint">Add your first song to get started!</p>
            </div>
        `;
        return;
    }

    playlist.innerHTML = songs.map((song, index) => `
        <div class="song-item ${song.id === currentSongId ? 'active' : ''}" onclick="handlePlaySong(${song.id})">
            <div class="song-index">${index + 1}</div>
            <div class="song-info">
                <div class="song-title">${escapeHtml(song.title)}</div>
                <div class="song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="song-duration">${song.durationFormatted}</div>
            <div class="song-actions">
                <button class="action-btn" onclick="event.stopPropagation(); removeSong(${song.id})" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    totalSongsEl.textContent = songs.length;

    const totalSeconds = songs.reduce((sum, song) => sum + song.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        totalDurationEl.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        totalDurationEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
}

function updateCurrentSong() {
    const currentSong = songs.find(song => song.id === currentSongId);

    if (currentSong) {
        currentSongTitleEl.textContent = currentSong.title;
        currentSongArtistEl.textContent = currentSong.artist;
    } else if (songs.length > 0) {
        // If no current song, show the first one
        currentSongTitleEl.textContent = songs[0].title;
        currentSongArtistEl.textContent = songs[0].artist;
        currentSongId = songs[0].id;
    } else {
        currentSongTitleEl.textContent = 'No song selected';
        currentSongArtistEl.textContent = '';
        currentSongId = null;
    }
}

// ==================== UTILITIES ====================

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==================== AUDIO PLAYER FUNCTIONS ====================

function togglePlay() {
    if (!currentSongId || songs.length === 0) {
        showToast('No song selected', 'error');
        return;
    }

    if (isPlaying) {
        audioPlayer.pause();
    } else {
        playCurrentSong();
    }
}

function playCurrentSong() {
    const currentSong = songs.find(s => s.id === currentSongId);
    if (!currentSong) return;

    // Use the uploaded audio file if available, otherwise use sample music
    if (currentSong.audioData) {
        audioPlayer.src = currentSong.audioData;
    } else {
        // Fallback to sample music if no audio data
        const musicIndex = (currentSong.id - 1) % SAMPLE_MUSIC_URLS.length;
        audioPlayer.src = SAMPLE_MUSIC_URLS[musicIndex];
    }

    audioPlayer.play().catch(err => {
        console.error('Error playing audio:', err);
        showToast('Error playing audio', 'error');
    });
}

function updatePlayButton() {
    if (isPlaying) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }
}

function updateProgress() {
    if (audioPlayer.duration) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressFill.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

function updateTotalTime() {
    if (audioPlayer.duration) {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }
}

function seekAudio(e) {
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

function handleSongEnd() {
    // Automatically play next song
    handleNext();
}

// Make functions globally available
window.handlePlaySong = handlePlaySong;
window.removeSong = removeSong;
