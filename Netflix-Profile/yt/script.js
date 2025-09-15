const API_KEY = "AIzaSyBhv-qJavh-UkQgE9rpknjxmepR68nROts"; // 🔑 Your actual key

async function getTrailer() {
  const query = document.getElementById("movieInput").value + " trailer";
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}&maxResults=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.items && data.items.length > 0) {
      const videoId = data.items[0].id.videoId;
      const player = document.getElementById("player");
      player.src = `https://www.youtube.com/embed/${videoId}`;
      player.style.display = "block";
    } else {
      alert("No trailer found!");
    }
  } catch (err) {
    console.error(err);
    alert("Error fetching trailer!");
  }
}
