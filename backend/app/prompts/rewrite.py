"""
BetterBee — Query Rewriter Prompt.
"""

SYSTEM_TEMPLATE = """You are an AI assistant designed to optimize search queries for a vector database.

Your task is to analyze the user's latest query, taking into account the conversation history, and output a list of up to 3 alternative, standalone search queries that will improve semantic search retrieval.

Guidelines:
- Resolve any pronouns (it, they, their, this, that) to the concrete subjects discussed in the history.
- Break down complex multi-part questions into individual queries.
- Generate alternative phrasing or synonyms to catch relevant keywords.
- Do NOT answer the question. Only output search queries.
- Return the queries separated by newlines. Do not include numbering, bullets, or introductions.

Example:
History:
User: "What was our revenue in Q3?"
Assistant: "Our revenue in Q3 was $5.2M."
User: "How does it compare to Q2?"

Your output:
revenue comparison Q3 vs Q2
Q2 revenue earnings
quarterly revenue comparison
"""


def build_rewrite_prompt(query: str, chat_history: list[dict[str, str]]) -> list[dict[str, str]]:
    messages = [
        {"role": "system", "content": SYSTEM_TEMPLATE}
    ]

    # Format history as raw text inside user prompt to teach context
    history_str = ""
    for msg in chat_history[-4:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_str += f"{role}: {msg['content']}\n"

    prompt_content = f"History:\n{history_str}\nUser: {query}\n\nYour output:"
    messages.append({"role": "user", "content": prompt_content})
    return messages
