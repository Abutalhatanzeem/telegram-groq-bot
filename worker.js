export default {
  async fetch(request) {

    const BOT_TOKEN = "8704763332:AAG7B_POD4K2xEJMRWbwBR8nUL7mMeAtg24";

    if (request.method !== "POST") {
      return new Response("✅ Bot is Running!");
    }

    const update = await request.json();
    if (!update.message?.text) return new Response("OK");

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    let reply = "";

    // Hello Response
    if (userText === "/start" || userText.toLowerCase().includes("hello")) {
      reply = "Hello! 👋 Main tumhara Groq AI Bot hoon!\nAbhi main sirf Hello samajhta hoon 😄";
    } else {
      reply = `Tumne likha: "${userText}" — Groq AI jald aayega! ⚡`;
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply
      })
    });

    return new Response("OK");
  }
}
