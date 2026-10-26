
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "phi3:latest";

const generateAIResponse = async (prompt) => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        stream: false,
        options: {
          num_predict: 60,
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(
        `Ollama API error: ${response.status} - ${errorDetails}`
      );
    }

    const data = await response.json();

    let text = data.response.trim();

    // Remove common unwanted response prefixes
    text = text.replace(
      /^(AI responds?:|Response:|Critical:|Analytical:|Supportive:)\s*/i,
      ""
    );

    return text.trim();
  } catch (error) {
    console.error("Ollama service error:", error.message);
    throw error;
  }
};

module.exports = {
  generateAIResponse,
};
