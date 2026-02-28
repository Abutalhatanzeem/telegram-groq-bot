export default {
  async fetch(request) {

    const BOT_TOKEN = "8704763332:AAG7B_POD4K2xEJMRWbwBR8nUL7mMeAtg24";
    const GROQ_API_KEY = "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";

    if (request.method !== "POST")
      return new Response("✅ Bot Running!");

    const update = await request.json();
    if (!update.message?.text) return new Response("OK");

    const chatId = update.message.chat.id;
    const userText = update.message.text;

    if (userText === "/start") {
      await sendMessage(BOT_TOKEN, chatId,
        "Hello! 👋 Main tumhara Groq AI Bot hoon!\nKuch bhi poochho! ⚡");
      return new Response("OK");
    }

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "Tum helpful assistant ho. Short jawab do." },
            { role: "user", content: userText }
          ],
          max_tokens: 500
        })
      });

      const groqData = await groqRes.json();

      // Rate limit check
      if (groqRes.status === 429) {
        await sendMessage(BOT_TOKEN, chatId, 
          "⏳ Thoda busy hoon, 10 second baad dobara try karo!");
        return new Response("OK");
      }

      const reply = groqData.choices?.[0]?.message?.content;

      if (!reply) {
        await sendMessage(BOT_TOKEN, chatId,
          "⚠️ Kuch gadbad hui: " + JSON.stringify(groqData));
        return new Response("OK");
      }

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
