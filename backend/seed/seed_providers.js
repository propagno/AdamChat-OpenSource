// seed_providers.js
//use adamchat;

const providers = [
  {
    "name": "chatgpt",
    "versions": {
      "v4": {
        "api_key": "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",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4",
        "max_tokens": 1500,
        "temperature": 0.7
      },
      "v4o": {
        "api_key": "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",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-4-0314",
        "max_tokens": 1500,
        "temperature": 0.7
      },
      "v3": {
        "api_key": "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",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-3",
        "max_tokens": 1100,
        "temperature": 0.7
      },
      "v3o_mini": {
        "api_key": "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",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-3.0-mini",
        "max_tokens": 800,
        "temperature": 0.7
      },
      "v35_turbo": {
        "api_key": "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",
        "endpoint": "https://api.openai.com/v1/chat/completions",
        "model": "gpt-3.5-turbo",
        "max_tokens": 1100,
        "temperature": 0.7
      }
    }
  },
  {
    "name": "gemini",
    "versions": {
      "default": {
        "api_key": "AIzaSyAbSorZ99e9cdSlQ32tBTLNK_bzIYHkZOw",
        "endpoint": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
      }
    }
  },
  {
    "name": "deepseek",
    "versions": {
      "default": {
        "api_key": "SUA_API_KEY_DEEPSEEK",
        "endpoint": "https://api.deepseek.ai/v1/...",
        "model": "default-deepseek-model",
        "max_tokens": 1000,
        "temperature": 0.7
      }
    }
  },
  {
    "name": "llama",
    "versions": {
      "default": {
        "api_key": "SUA_API_KEY_LLAMA",
        "endpoint": "https://api.llama.ai/v1/...",
        "model": "default-llama-model",
        "max_tokens": 1000,
        "temperature": 0.7
      }
    }
  },
  {
    "name": "copilot",
    "versions": {
      "default": {
        "api_key": "SUA_API_KEY_COPILOT",
        "endpoint": "https://api.copilot.ai/v1/...",
        "model": "default-copilot-model",
        "max_tokens": 1000,
        "temperature": 0.7
      }
    }
  },
  {
    "name": "claude",
    "versions": {
      "default": {
        "api_key": "SUA_API_KEY_CLAUDE",
        "endpoint": "https://api.anthropic.com/v1/...",
        "model": "default-claude-model",
        "max_tokens": 1000,
        "temperature": 0.7
      }
    }
  }
];

db.providers.deleteMany({});
db.providers.insertMany(providers);
print("Seed de providers concluída!");
