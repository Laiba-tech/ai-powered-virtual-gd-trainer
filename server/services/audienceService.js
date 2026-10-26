
const MODEL = process.env.OLLAMA_MODEL || "llama3.2";

async function generateAudienceReaction(transcript) {
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You simulate a respectful audience at a public speaking practice session. Return one short, relevant audience question or constructive reaction. Do not pretend to observe real audience emotions.",
        },
        {
          role: "user",
          content: `Respond to this speech excerpt:\n${transcript}`,
        },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama audience request failed: ${response.status}`);
  }

  const data = await response.json();
  const reaction = data.message?.content?.trim();

  if (!reaction) {
    throw new Error("Ollama returned no audience response.");
  }

  return reaction;
}

module.exports = { generateAudienceReaction };
