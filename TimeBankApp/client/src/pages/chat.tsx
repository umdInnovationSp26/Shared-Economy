import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, Info, Plus, Loader2, Camera, X } from "lucide-react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where, } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import NewChatModal from "@/components/ui/new-chat-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Chat = {
  id: string;
  isGroup?: boolean;
  name?: string;                          // group chats only
  groupPhotoUrl?: string;                 // group chats only
  memberNames?: Record<string, string>;   // { uid: displayName }
  memberAvatars?: Record<string, string>; // { uid: avatarUrl } — no stored initials
  participantIds?: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
};

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Matches the pattern used in layout.tsx and settings.tsx */
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Display name: for DMs look up the other participant; for groups use group name */
function getChatDisplayName(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return chat.name ?? "Group Chat";
  if (!chat.memberNames || !chat.participantIds) return "Unknown";
  const otherId = chat.participantIds.find((id) => id !== currentUserId);
  return otherId ? (chat.memberNames[otherId] ?? "Unknown") : "Unknown";
}

/** Avatar URL: for DMs use other participant's photo; for groups use groupPhotoUrl */
function getChatAvatarUrl(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return chat.groupPhotoUrl ?? "";
  if (!chat.memberAvatars || !chat.participantIds) return "";
  const otherId = chat.participantIds.find((id) => id !== currentUserId);
  return otherId ? (chat.memberAvatars[otherId] ?? "") : "";
}

/** Fallback initials for a chat's avatar */
function getChatInitials(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return getInitials(chat.name ?? "G");
  const displayName = getChatDisplayName(chat, currentUserId);
  return getInitials(displayName);
}

/** Avatar URL for a specific message sender */
function getSenderAvatarUrl(chat: Chat, senderId: string): string {
  return chat.memberAvatars?.[senderId] ?? "";
}

/** Initials for a specific message sender */
function getSenderInitials(chat: Chat, senderId: string): string {
  const name = chat.memberNames?.[senderId] ?? "";
  return getInitials(name);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Chat() {
  const currentUserId = auth.currentUser?.uid;

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  // Group photo editing state
  const [editingGroupPhoto, setEditingGroupPhoto] = useState(false);
  const [groupPhotoInput, setGroupPhotoInput] = useState("");
  const [savingGroupPhoto, setSavingGroupPhoto] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Load chats where current user is a participant
  useEffect(() => {
    if (!currentUserId) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, 
      where("participantIds", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];

      setChats(fetched);
      setLoadingChats(false);
      setActiveChat((prev) => {
        // Keep active chat in sync with latest data (e.g. groupPhotoUrl updates)
        if (prev) {
          const updated = fetched.find((c) => c.id === prev.id);
          if (updated) return updated;
        }
        return prev ?? fetched[0] ?? null;
      });
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // 2. Subscribe to messages for the active chat
  useEffect(() => {
    if (!currentUserId || !activeChat) return;
    setLoadingMessages(true);
    setMessages([]);

    const q = query(
      collection(db, "chats", activeChat.id, "messages"),
      orderBy("timestamp", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Message[]);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUserId, activeChat?.id]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Reset group photo editor when chat changes
  useEffect(() => {
    setEditingGroupPhoto(false);
    setGroupPhotoInput("");
  }, [activeChat?.id]);

  // 5. Send a message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !currentUserId || !activeChat) return;

    const text = message.trim();
    setMessage("");

    const messagesRef = collection(
      db, "chats", activeChat.id, "messages"
    );

    // Add the message
    await addDoc(messagesRef, {
      text,
      senderId: currentUserId,
      timestamp: serverTimestamp(),
    });

    // Update chat's lastMessage metadata
    const chatRef = doc(db, "chats", activeChat.id);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
    });
  };

  // 6. Save group photo URL
  const handleSaveGroupPhoto = async () => {
    if (!activeChat?.isGroup) return;
    setSavingGroupPhoto(true);
    try {
      await updateDoc(doc(db, "chats", activeChat.id), {
        groupPhotoUrl: groupPhotoInput.trim(),
      });
      setEditingGroupPhoto(false);
    } finally {
      setSavingGroupPhoto(false);
    }
  };

  // 7. Handle new chat created from modal
  const handleChatCreated = (chatId: string) => {
    setTimeout(() => {
      setChats((prev) => {
        const found = prev.find((c) => c.id === chatId);
        if (found) setActiveChat(found);
        return prev;
      });
    }, 600);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate?.() ?? new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="h-full flex overflow-hidden bg-background">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-80 border-r bg-card/50 flex flex-col h-full flex-shrink-0 hidden md:flex">
          <div className="p-4 border-b flex justify-between items-center bg-card">
            <h2 className="font-semibold text-lg">Messages</h2>
            {/* ← This now opens the modal */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNewChatOpen(true)}
              className="rounded-full bg-secondary/50 hover:bg-secondary"
            >
              <Plus className="h-5 w-5 text-secondary-foreground" />
            </Button>
          </div>
          <div className="p-2">
            <Input placeholder="Search conversations..." className="bg-background h-9 text-sm" />
          </div>
          <ScrollArea className="flex-1">
            {loadingChats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3">
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNewChatOpen(true)}
                  className="rounded-full gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Start a conversation
                </Button>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.map((chat) => {
                  const displayName = getChatDisplayName(chat, currentUserId ?? "");
                  const avatarUrl   = getChatAvatarUrl(chat, currentUserId ?? "");
                  const initials    = getChatInitials(chat, currentUserId ?? "");
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setActiveChat(chat)}
                      className={`w-full text-left p-3 rounded-xl flex gap-3 items-center transition-colors ${
                        activeChat?.id === chat.id ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 border border-background">
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className={chat.isGroup ? "bg-blue-100 text-blue-700" : "bg-primary/20 text-primary"}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {(chat.unread ?? 0) > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background text-[10px] flex items-center justify-center text-white font-bold">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-semibold text-sm truncate ${activeChat?.id === chat.id ? "text-primary" : ""}`}>
                            {displayName}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTime(chat.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-xs truncate text-muted-foreground">{chat.lastMessage ?? ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── Chat Area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full bg-white relative">
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <p className="text-sm">No conversation selected</p>
              <Button
                variant="outline"
                onClick={() => setNewChatOpen(true)}
                className="rounded-full gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Start a conversation
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="h-16 border-b flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  {/* Group photo with edit button */}
                  <div className="relative group/avatar">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getChatAvatarUrl(activeChat, currentUserId ?? "")} />
                      <AvatarFallback className={activeChat.isGroup ? "bg-blue-100 text-blue-700" : "bg-primary/20 text-primary"}>
                        {getChatInitials(activeChat, currentUserId ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    {/* Camera button — only visible for group chats */}
                    {activeChat.isGroup && (
                      <button
                        onClick={() => {
                          setGroupPhotoInput(activeChat.groupPhotoUrl ?? "");
                          setEditingGroupPhoto(true);
                        }}
                        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Camera className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{getChatDisplayName(activeChat, currentUserId ?? "")}</h3>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                      {activeChat.isGroup ? "Group chat" : "Online"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Info className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Group photo editor — inline below header */}
              {editingGroupPhoto && activeChat.isGroup && (
                <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={groupPhotoInput} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getChatInitials(activeChat, currentUserId ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    autoFocus
                    placeholder="Paste group photo URL…"
                    value={groupPhotoInput}
                    onChange={(e) => setGroupPhotoInput(e.target.value)}
                    className="h-9 flex-1"
                  />
                  <Button size="sm" onClick={handleSaveGroupPhoto} disabled={savingGroupPhoto} className="shrink-0">
                    {savingGroupPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                  </Button>
                  <button onClick={() => setEditingGroupPhoto(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="text-center">
                    <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full font-medium">Today</span>
                  </div>

                  {loadingMessages ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-12">
                      No messages yet. Say hello! 👋
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMe          = msg.senderId === currentUserId;
                      const senderUrl     = getSenderAvatarUrl(activeChat, msg.senderId);
                      const senderInitials = getSenderInitials(activeChat, msg.senderId);
                      // Show sender name above bubble in group chats
                      const senderName    = !isMe && activeChat.isGroup
                        ? (activeChat.memberNames?.[msg.senderId] ?? "Unknown")
                        : null;

                      return (
                        <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto justify-end" : ""}`}>
                          {!isMe && (
                            <Avatar className="h-8 w-8 mt-auto shrink-0">
                              <AvatarImage src={senderUrl} />
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {senderInitials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex flex-col gap-0.5">
                            {senderName && (
                              <p className="text-[11px] text-muted-foreground font-medium ml-1">{senderName}</p>
                            )}
                            <div className={`p-3 px-4 rounded-2xl ${
                              isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                            }`}>
                              <p className="text-sm">{msg.text}</p>
                              <p className={`text-[10px] mt-1 text-right ${
                                isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 bg-white border-t">
                <form
                  onSubmit={handleSendMessage}
                  className="max-w-3xl mx-auto flex items-center gap-2 bg-muted/30 border rounded-full p-1 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all"
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10"
                  />
                  <Button
                    type="submit"
                    disabled={!message.trim()}
                    size="icon"
                    className="rounded-full shrink-0 h-10 w-10 bg-primary hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4 ml-1" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onChatCreated={handleChatCreated}
      />
    </>
  );
}