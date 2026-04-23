import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, Info, Plus, Loader2 } from "lucide-react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, updateDoc,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import NewChatModal from "@/components/ui/new-chat-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Chat = {
  id: string;
  isGroup?: boolean;
  name?: string; // only present on group chats
  avatar?: string;
  memberNames?: Record<string, string>;
  memberInitials?: Record<string, string>;
  participantIds?: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  unread?: number;
};

function getChatDisplayName(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return chat.name ?? "Group Chat";
  if (!chat.memberNames || !chat.participantIds) return "Unknown";
  const otherId = chat.participantIds.find((id) => id !== currentUserId);
  return otherId ? (chat.memberNames[otherId] ?? "Unknown") : "Unknown";
}

function getChatAvatar(chat: Chat, currentUserId: string): string {
  if (chat.isGroup) return (chat.name ?? "G").slice(0, 2).toUpperCase();
  if (!chat.memberInitials || !chat.participantIds) return "?";
  const otherId = chat.participantIds.find((id) => id !== currentUserId);
  return otherId ? (chat.memberInitials[otherId] ?? "?") : "?";
}

function getSenderAvatar(chat: Chat, senderId: string): string {
  return chat.memberInitials?.[senderId] ?? "?";
}

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: any;
};

// ─── Fallback static chats (replace with Firestore fetch if needed) ───────────

const STATIC_CHATS: Chat[] = [
  { id: "chat_mark",    name: "Mark S.",               avatar: "MS" },
  { id: "chat_sarah",   name: "Sarah J.",               avatar: "SJ", unread: 2 },
  { id: "chat_garden",  name: "Community Garden Group", avatar: "CG", isGroup: true },
  { id: "chat_david",   name: "David L.",               avatar: "DL" },
];

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
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Load this user's chats in real-time
  useEffect(() => {
    if (!currentUserId) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, 
      where("participantIds", "array-contains", currentUserId),
      orderBy("lastMessageTime", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Chat[];

      setChats(fetched);
      setLoadingChats(false);
      setActiveChat((prev) => prev ?? fetched[0] ?? null);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // ── 2. Subscribe to messages for the active chat ───────────────────────────
  useEffect(() => {
    if (!currentUserId || !activeChat) return;

    setLoadingMessages(true);
    setMessages([]);

    const messagesRef = collection(
      db, "chats", activeChat.id, "messages"
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Message[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(fetched);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [currentUserId, activeChat?.id]);

  // ── 3. Auto-scroll to bottom when messages update ─────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 4. Send a message ─────────────────────────────────────────────────────
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

  // 5. Handle a new chat being created from the modal
  const handleChatCreated = (chatId: string) => {
    // The onSnapshot listener will pick up the new chat automatically.
    // We just need to select it once it appears in the list.
    setActiveChat((prev) => {
      // If already in chats list, select it immediately
      const existing = chats.find((c) => c.id === chatId);
      return existing ?? prev;
    });

    // Fallback: wait for the snapshot to update, then select
    setTimeout(() => {
      setChats((prev) => {
        const found = prev.find((c) => c.id === chatId);
        if (found) setActiveChat(found);
        return prev;
      });
    }, 600);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate?.() ?? new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="h-full flex overflow-hidden bg-background">

        {/* Sidebar */}
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
                  const avatar = getChatAvatar(chat, currentUserId ?? "");
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
                          <AvatarFallback className={chat.isGroup ? "bg-blue-100 text-blue-700" : "bg-primary/20 text-primary"}>
                            {avatar}                          {/* ← was chat.avatar */}
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
                            {displayName}                     {/* ← was chat.name */}
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

        {/* Chat Area */}
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
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={activeChat.isGroup ? "bg-blue-100 text-blue-700" : "bg-primary/20 text-primary"}>
                      {getChatAvatar(activeChat, currentUserId ?? "")}
                    </AvatarFallback>
                  </Avatar>
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
                      const isMe = msg.senderId === currentUserId;
                      const senderAvatar = getSenderAvatar(activeChat, msg.senderId)
                      return (
                        <div key={msg.id} className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto justify-end" : ""}`}>
                          {!isMe && (
                            <Avatar className="h-8 w-8 mt-auto shrink-0">
                              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                {senderAvatar}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`p-3 px-4 rounded-2xl ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-[10px] mt-1 text-right ${
                              isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {formatTime(msg.timestamp)}
                            </p>
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