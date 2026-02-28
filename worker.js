export default {
  async fetch(request) {

    // ===== APNI KEYS YAHAN DAALO =====
    const BOT_TOKEN = "8704763332:AAG7B_POD4K2xEJMRWbwBR8nUL7mMeAtg24";
    const GROQ_API_KEY = "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";
    const SERPER_API_KEY = "4b660329f7abc5e8c92efa0347ff631a0238e908";
    // ==================================

    if (request.method !== "POST")
      return new Response("✅ Super Bot Running!");

    const update = await request.json();
    if (!update.message?.text) return new Response("OK");

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    // /start
    if (userText === "/start") {
      await sendMessage(BOT_TOKEN, chatId,
        "Hello! 👋 Main tumhara Super AI Bot hoon!\n\n" +
        "🤖 Normal sawaal → AI jawab\n" +
        "🌐 /search [query] → Web search\n" +
        "📰 /news [topic] → Latest news\n" +
        "🖼️ /image [query] → Images links\n" +
        "🎨 /imagine [prompt] → AI Image banao\n" +
        "🌤️ /weather [city] → Mausam\n" +
        "🔢 /calc [expression] → Calculator\n\n" +
        "Examples:\n" +
        "/imagine a cat on moon\n" +
        "/search Pakistan news\n" +
        "/weather Karachi"
      );
      return new Response("OK");
    }

    // /imagine — AI Image Generate
    if (userText.startsWith("/imagine ")) {
      const prompt = userText.replace("/imagine ", "").trim();
      await sendMessage(BOT_TOKEN, chatId, "🎨 Image bana raha hoon: " + prompt + "\n⏳ Thoda wait karo...");

      try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

        await sendPhoto(BOT_TOKEN, chatId, imageUrl, "🎨 " + prompt);
      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Image Error: " + err.message);
      }

      return new Response("OK");
    }

    // /search
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

        const summary = await getGroqReply(
          GROQ_API_KEY,
          `Query: ${query}\n\nSearch Results:\n${searchContext}\n\nShort summary do.`
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

    // /news
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

        const summary = await getGroqReply(
          GROQ_API_KEY,
          `Topic: ${topic}\n\nNews:\n${newsContext}\n\nShort summary do.`
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

    // /image — Image Search
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

    // /weather
    if (userText.startsWith("/weather ")) {
      const city = userText.replace("/weather ", "").trim();
      await sendMessage(BOT_TOKEN, chatId, "🌤️ Mausam check kar raha hoon: " + city);

      try {
        const weatherRes = await fetch(
          `https://wttr.in/${encodeURIComponent(city)}?format=3`
        );
        const weatherText = await weatherRes.text();
        await sendMessage(BOT_TOKEN, chatId, "🌤️ " + weatherText);
      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Weather Error: " + err.message);
      }

      return new Response("OK");
    }

    // /calc
    if (userText.startsWith("/calc ")) {
      const expression = userText.replace("/calc ", "").trim();
      try {
        const result = await getGroqReply(
          GROQ_API_KEY,
          `Sirf yeh math calculate karo aur sirf answer do, koi explanation nahi: ${expression}`
        );
        await sendMessage(BOT_TOKEN, chatId, `🔢 ${expression} = ${result}`);
      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Calc Error: " + err.message);
      }

      return new Response("OK");
    }

    // Normal AI Chat
    try {
      const reply = await getGroqReply(GROQ_API_KEY, userText);
      await sendMessage(BOT_TOKEN, chatId, reply);
    } catch (err) {
      await sendMessage(BOT_TOKEN, chatId, "❌ Error: " + err.message);
    }

    return new Response("OK");
  }
}

// Groq AI Helper
async function getGroqReply(apiKey, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Tum ek helpful AI assistant ho. Clear aur accurate jawab do. Hinglish use kar sakte ho."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 700
    })
  });

  const data = await res.json();
  if (res.status === 429) return "⏳ Busy hoon, 10 second baad try karo!";
  if (!res.ok) return "⚠️ Error: " + (data.error?.message || "Unknown");
  return data.choices?.[0]?.message?.content || "⚠️ Jawab nahi mila!";
}

// Telegram Text Message
async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

// Telegram Photo Send
async function sendPhoto(token, chatId, photoUrl, caption) {
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption: caption
    })
  });
}
