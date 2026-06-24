const Chat = require("../models/Chat");

const MAX_UNPINNED_CHATS = 10;

/**
 * Keep only the MAX_UNPINNED_CHATS most recently updated unpinned chats for a
 * user; delete older unpinned ones. Pinned (saved) chats are never pruned.
 */
const pruneUnpinnedChats = async (userId) => {
    const unpinned = await Chat.find({ user: userId, isPinned: false })
        .sort({ updatedAt: -1 })
        .select("_id");

    if (unpinned.length > MAX_UNPINNED_CHATS) {
        const idsToDelete = unpinned
            .slice(MAX_UNPINNED_CHATS)
            .map((chat) => chat._id);
        await Chat.deleteMany({ _id: { $in: idsToDelete } });
    }
};

const deriveTitle = (messages) => {
    const firstUser = (messages || []).find((m) => m.role === "user");
    const text = (firstUser && firstUser.content ? firstUser.content : "").trim();
    if (!text) return "New chat";
    return text.length > 40 ? text.slice(0, 40) + "…" : text;
};

/**
 * List the user's chats for the sidebar: saved (pinned) chats first, then the
 * most recent unpinned chats. Message bodies are omitted to keep it light.
 */
const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id })
            .select("title isPinned updatedAt")
            .sort({ isPinned: -1, updatedAt: -1 });
        return res.status(200).json({ chats });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Server error when retrieving chats" });
    }
};

/** Return a single chat (with its messages) owned by the user. */
const getChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: "Chat not found" });
        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        return res.status(200).json({ chat });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Server error when retrieving chat" });
    }
};

/**
 * Create or update a chat from the full message list the assistant page keeps.
 * Body: { chatId?, messages: [{role, content}], title? }
 * Returns the saved chat (with its _id, so the page can keep saving to it).
 */
const saveChat = async (req, res) => {
    const { chatId, messages, title } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: "messages are required" });
    }

    // Keep only valid {role, content} entries.
    const cleaned = messages
        .filter(
            (m) =>
                m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string"
        )
        .map((m) => ({ role: m.role, content: m.content }));

    if (cleaned.length === 0) {
        return res.status(400).json({ message: "No valid messages" });
    }

    try {
        let chat;
        if (chatId) {
            chat = await Chat.findById(chatId);
            if (!chat) return res.status(404).json({ message: "Chat not found" });
            if (chat.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Unauthorized" });
            }
            chat.messages = cleaned;
            if (title) chat.title = title;
        } else {
            chat = new Chat({
                user: req.user._id,
                title: title || deriveTitle(cleaned),
                messages: cleaned,
            });
        }

        await chat.save();
        await pruneUnpinnedChats(req.user._id);

        return res.status(200).json({ chat });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Server error when saving chat" });
    }
};

/**
 * Toggle/set whether a chat is saved (pinned). Saved chats sort to the top of
 * the history and are exempt from auto-deletion.
 */
const togglePin = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: "Chat not found" });
        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        chat.isPinned =
            typeof req.body?.isPinned === "boolean"
                ? req.body.isPinned
                : !chat.isPinned;
        await chat.save();

        if (!chat.isPinned) await pruneUnpinnedChats(req.user._id);

        return res.status(200).json({ chat });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Server error when saving chat" });
    }
};

const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) return res.status(404).json({ message: "Chat not found" });
        if (chat.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        await Chat.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "Chat deleted" });
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Server error when deleting chat" });
    }
};

module.exports = {
    getChats,
    getChat,
    saveChat,
    togglePin,
    deleteChat,
};
