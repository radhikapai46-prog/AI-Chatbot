const API_KEY = "AIzaSyBWkvalyrcBQSoKIDddo6tz6rO0AxYV3Tk";

let chats = JSON.parse(localStorage.getItem("chats")) || {};
let currentChat = null;

/* Create new chat */
function createNewChat() {
  currentChat = "chat_" + Date.now();

  chats[currentChat] = {
    title: "New Chat",
    messages: [
      {
        role: "user",
        parts: [{ text: "You are a helpful AI assistant." }]
      }
    ]
  };

  saveChats();
  renderHistory();
  loadChat(currentChat);
}

/* Save chats */
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/* Render sidebar with FIRST QUESTION */
function renderHistory() {
  const list = document.getElementById("history-list");
  list.innerHTML = "";

  Object.keys(chats).forEach(id => {
    const chat = chats[id];

    const div = document.createElement("div");
    div.className = "history-item";

    // show first real user message
    const firstMsg = chat.messages.find(m => m.role === "user" && m.parts[0].text !== "You are a helpful AI assistant.");

    div.innerText = firstMsg ? firstMsg.parts[0].text.slice(0, 30) + "..." : "New Chat";

    div.onclick = () => loadChat(id);
    list.appendChild(div);
  });
}

/* Load chat */
function loadChat(id) {
  currentChat = id;
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  chats[id].messages.forEach(msg => {
    if (msg.role === "user" || msg.role === "model") {
      addMessage(msg.parts[0].text, msg.role === "user" ? "user" : "bot");
    }
  });
}

/* Send message */
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = input.value.trim();
  if (!text || !currentChat) return;

  addMessage(text, "user");
  input.value = "";

  chats[currentChat].messages.push({
    role: "user",
    parts: [{ text }]
  });

  const loading = addMessage("Typing...", "bot");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: chats[currentChat].messages
        })
      }
    );

    const data = await res.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    loading.remove();
    addMessage(reply, "bot");

    chats[currentChat].messages.push({
      role: "model",
      parts: [{ text: reply }]
    });

    saveChats();
    renderHistory();

  } catch (err) {
    loading.innerText = "Error getting response";
  }
}

/* Add message */
function addMessage(text, sender) {
  const chatBox = document.getElementById("chat-box");

  const wrapper = document.createElement("div");
  wrapper.className = "message " + sender;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerText = text;

  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);

  chatBox.scrollTop = chatBox.scrollHeight;

  return wrapper;
}

/* Init */
renderHistory();
createNewChat();

/* Enter key */
document.getElementById("user-input").addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});