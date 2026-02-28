export default {
  async fetch(request) {

    const BOT_TOKEN = "8704763332:AAG7B_POD4K2xEJMRWbwBR8nUL7mMeAtg24";
    const GROQ_API_KEY = "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";
    const TAVILY_API_KEY = "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";

    if (request.method !== "POST")
      return new Response("✅ Bot Running!");

    const update = await request.json();
    if (!update.message?.text) return new Response("OK");

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    if (userText === "/start") {
      await sendMessage(BOT_TOKEN, chatId,
        "Hello! 👋 Main tumhara AI Bot hoon!\n\n🤖 Kuch bhi poochho\n🌐 /search [query] - Web search karo\n\nExample: /search Pakistan weather today");
      return new Response("OK");
    }

    // Web Search Command
    if (userText.startsWith("/search ")) {
      const query = userText.replace("/search ", "");
      await sendMessage(BOT_TOKEN, chatId, "🔍 Search kar raha hoon...");

      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: query,
            max_results: 3
          })
        });

        const searchData = await searchRes.json();
        const results = searchData.results;

        if (!results || results.length === 0) {
          await sendMessage(BOT_TOKEN, chatId, "❌ Koi result nahi mila!");
          return new Response("OK");
        }

        // Results Groq ko bhejo summary ke liye
        const searchContext = results.map((r, i) => 
          `${i+1}. ${r.title}\n${r.content}`
        ).join("\n\n");

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { 
                role: "system", 
                content: "Tum helpful assistant ho. User ke search results ko short aur clear summary mein batao. Hinglish use kar sakte ho." 
              },
              { 
                role: "user", 
                content: `Query: ${query}\n\nSearch Results:\n${searchContext}\n\nIn results ki short summary do.` 
              }
            ],
            max_tokens: 500
          })
        });

        const groqData = await groqRes.json();
        const summary = groqData.choices?.[0]?.message?.content || "Summary nahi bana saka!";

        const finalReply = `🌐 Search: "${query}"\n\n${summary}\n\n🔗 Sources:\n` + 
          results.map(r => `• ${r.url}`).join("\n");

        await sendMessage(BOT_TOKEN, chatId, finalReply);

      } catch (err) {
        await sendMessage(BOT_TOKEN, chatId, "❌ Search Error: " + err.message);
      }

      return new Response("OK");
    }

    // Normal AI Chat
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Tum helpful assistant ho. Short aur clear jawab do. Hinglish use kar sakte ho." },
            { role: "user", content: userText }
          ],
          max_tokens: 500
        })
      });

      const groqData = await groqRes.json();

      if (groqRes.status === 429) {
        await sendMessage(BOT_TOKEN, chatId, "⏳ Busy hoon, 10 second baad try karo!");
        return new Response("OK");
      }

      const reply = groqData.choices?.[0]?.message?.content || "⚠️ Jawab nahi mila!";
      await sendMessage(BOT_TOKEN, chatId, reply);

    } catch (err) {
      await sendMessage(BOT_TOKEN, chatId, "❌ Error: " + err.message);
    }

    return new Response("OK");
  }
}

async function sendMessage(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}
