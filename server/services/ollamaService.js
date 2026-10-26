
const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "phi3:latest";

const generateAIResponse = async (prompt) => {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
const OLLAMA_TIMEOUT_MS = 60_000;

const generateAIResponse = async (prompt, { signal } = {}) => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();

  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      signal: controller.signal,
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
      throw Object.assign(
        new Error(`Ollama returned HTTP ${response.status}.`),
        { code: "OLLAMA_UPSTREAM_ERROR" }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (signal?.aborted || timedOut || error?.name === "AbortError") {
        throw error;
      }

      throw Object.assign(new Error("Ollama returned invalid JSON."), {
        code: "OLLAMA_INVALID_RESPONSE",
      });
    }

    let text =
      data && typeof data.response === "string" ? data.response.trim() : "";

    // Remove common unwanted response prefixes
    text = text.replace(
      /^(AI responds?:|Response:|Critical:|Analytical:|Supportive:)\s*/i,
      ""
    );

    return text.trim();
  } catch (error) {
    console.error("Ollama service error:", error.message);
    throw error;
    text = text.trim();
    if (!text) {
      throw Object.assign(new Error("Ollama returned an empty response."), {
        code: "OLLAMA_EMPTY_RESPONSE",
      });
    }

    return text;
  } catch (error) {
    if (signal?.aborted) {
      throw Object.assign(new Error("Ollama request was cancelled."), {
        code: "OLLAMA_CANCELLED",
      });
    }

    if (typeof error?.code === "string" && error.code.startsWith("OLLAMA_")) {
      console.error("Ollama service error:", error.message);
      throw error;
    }

    if (timedOut || error?.name === "AbortError") {
      const timeoutError = Object.assign(
        new Error("Ollama request timed out."),
        { code: "OLLAMA_TIMEOUT" }
      );
      console.error("Ollama service error:", timeoutError.message);
      throw timeoutError;
    }

    const unavailableError = Object.assign(
      new Error("Unable to connect to the local Ollama service."),
      { code: "OLLAMA_UNAVAILABLE" }
    );
    console.error("Ollama service error:", unavailableError.message);
    throw unavailableError;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
};

module.exports = {
  generateAIResponse,
};
