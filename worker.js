export default {
  async fetch(request) {

    // ===== APNI KEYS YAHAN DAALO =====
    const BOT_TOKEN = "8704763332:AAG7B_POD4K2xEJMRWbwBR8nUL7mMeAtg24";
    const GEMINI_API_KEY = "AIzaSyBmTLcn8S1Ebh2jhyz9-08dEGCzxkTa6vk";
    const SERPER_API_KEY = "4b660329f7abc5e8c92efa0347ff631a0238e908";
    // ==================================

    if (request.method !== "POST")
      return new Response("✅ Bot Running!");

    const update = await request.json();
    if (!update.message?.text) return new Response("OK");

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    // /start command
    if (userText === "/start") {
      await sendMessage(BOT_TOKEN, chatId,
        "Hello! 👋 Main tumhara Gemini AI Bot hoon!\n\n" +
        "🤖 Normal sawaal → Gemini AI jawab\n" +
        "🌐 /search [query] → Web search\n" +
        "📰 /news [topic] → Latest news\n" +
        "🖼️ /image [query] → Images dhundho\n\n" +
        "Examples:\n" +
        "/search Pakistan weather today\n" +
        "/news cricket\n" +
        "/image mountains"
      );
      return new Response("OK");
    }

    // /search command
    if (userText.startsWith("/search ")) {
      const query = userText.replace("/search ", "").trim();
      await sendMessage(BOT_TOKEN, chatId, "🔍 Search kar raha hoon: " + query);

      try {
        const searchRes = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ q: query, num: 3 })
        });

        const searchData = await searchRes.json();
        const results = searchData.organic || [];

        if (results.length === 0) {
          await sendMessage(BOT_TOKEN, chatId, "❌ Koi result nahi mila!");
          return new Response("OK");
        }

        const searchContext = results.map((r, i) =>
          `${i + 1}. ${r.title}\n${r.snippet}`
        ).join("\n\n");

        const summary = await getGeminiReply(
          GEMINI_API_KEY,
          `Query: ${query}\n\nSearch Results:\n${searchContext}\n\nIn results ki short aur clear summary do.`
        );

        const sources = results.map(r => `• ${r.link}`).join("\n");
        await sendMessage(BOT_TOKEN, chatId,
          `🌐 Search: "${query}"\n\n${summary}\n\n🔗 Sources:\n${sources}`
        );

      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Search Error: " + err.message);
      }

      return new Response("OK");
    }

    // /news command
    if (userText.startsWith("/news ")) {
      const topic = userText.replace("/news ", "").trim();
      await sendMessage(BOT_TOKEN, chatId, "📰 News dhundh raha hoon: " + topic);

      try {
        const newsRes = await fetch("https://google.serper.dev/news", {
          method: "POST",
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ q: topic, num: 3 })
        });

        const newsData = await newsRes.json();
        const articles = newsData.news || [];

        if (articles.length === 0) {
          await sendMessage(BOT_TOKEN, chatId, "❌ Koi news nahi mili!");
          return new Response("OK");
        }

        const newsContext = articles.map((a, i) =>
          `${i + 1}. ${a.title}\n${a.snippet}`
        ).join("\n\n");

        const summary = await getGeminiReply(
          GEMINI_API_KEY,
          `Topic: ${topic}\n\nNews:\n${newsContext}\n\nIn news ki short summary do.`
        );

        const links = articles.map(a => `• ${a.title}\n  ${a.link}`).join("\n");
        await sendMessage(BOT_TOKEN, chatId,
          `📰 News: "${topic}"\n\n${summary}\n\n🔗 Articles:\n${links}`
        );

      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ News Error: " + err.message);
      }

      return new Response("OK");
    }

    // /image command
    if (userText.startsWith("/image ")) {
      const query = userText.replace("/image ", "").trim();
      await sendMessage(BOT_TOKEN, chatId, "🖼️ Images dhundh raha hoon: " + query);

      try {
        const imgRes = await fetch("https://google.serper.dev/images", {
          method: "POST",
          headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ q: query, num: 3 })
        });

        const imgData = await imgRes.json();
        const images = imgData.images || [];

        if (images.length === 0) {
          await sendMessage(BOT_TOKEN, chatId, "❌ Koi image nahi mili!");
          return new Response("OK");
        }

        const imageLinks = images.map((img, i) =>
          `${i + 1}. ${img.title}\n🔗 ${img.imageUrl}`
        ).join("\n\n");

        await sendMessage(BOT_TOKEN, chatId,
          `🖼️ Images: "${query}"\n\n${imageLinks}`
        );

      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Image Error: " + err.message);
      }

      return new Response("OK");
    }

    // Normal AI Chat — Gemini
    try {
      const reply = await getGeminiReply(GEMINI_API_KEY, userText);
      await sendMessage(BOT_TOKEN, chatId, reply);
    } catch (err) {
      await sendMessage(BOT_TOKEN, chatId, "❌ Error: " + err.message);
    }

    return new Response("OK");
  }
}

// Gemini AI Helper
async function getGeminiReply(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Tum ek helpful AI assistant ho. Clear, short aur accurate jawab do. Hinglish use kar sakte ho.\n\n" + prompt
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 700
        }
      })
    }
  );

  const data = await res.json();
  if (!res.ok) return "⚠️ Gemini Error: " + (data.error?.message || "Unknown error");
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Jawab nahi mila!";
}

// Telegram Message Helper
async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}
