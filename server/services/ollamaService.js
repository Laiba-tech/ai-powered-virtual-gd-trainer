
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const MODEL_NAME = process.env.OLLAMA_MODEL || "phi3:latest";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 60000);

const generateAIResponse = async (prompt, { signal } = {}) => {
  const controller = new AbortController();
  let timedOut = false;

  const abortFromCaller = () => controller.abort();

  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, OLLAMA_TIMEOUT_MS);

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
          num_predict: 180,
          temperature: 0.6,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw Object.assign(
        new Error(`Ollama API error: ${response.status} - ${errorText}`),
        { code: "OLLAMA_UPSTREAM_ERROR" }
      );
    }

    const data = await response.json();
    let text =
      data && typeof data.response === "string" ? data.response.trim() : "";

    text = text.replace(
      /^(AI responds?:|Response:|Critical:|Analytical:|Supportive:)\s*/i,
      ""
    );

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

    if (timedOut || error?.name === "AbortError") {
      const timeoutError = Object.assign(
        new Error("Ollama request timed out."),
        { code: "OLLAMA_TIMEOUT" }
      );
      console.error("Ollama service error:", timeoutError.message);
      throw timeoutError;
    }

    if (error?.code && error.code.startsWith("OLLAMA_")) {
      console.error("Ollama service error:", error.message);
      throw error;
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
