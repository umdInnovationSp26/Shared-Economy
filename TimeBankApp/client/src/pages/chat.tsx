import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Phone, Video, Info, Plus } from "lucide-react";

const CHATS = [
  {
    id: 1,
    name: "Mark S.",
    lastMessage: "Sounds good, see you at 2!",
    time: "10:42 AM",
    unread: 0,
    avatar: "MS",
  },
  {
    id: 2,
    name: "Sarah J.",
    lastMessage: "Do I need to bring my own shovel?",
    time: "Yesterday",
    unread: 2,
    avatar: "SJ",
  },
  {
    id: 3,
    name: "Community Garden Group",
    lastMessage: "Alex: The soil delivery arrived.",
    time: "Yesterday",
    unread: 0,
    avatar: "CG",
    isGroup: true,
  },
  {
    id: 4,
    name: "David L.",
    lastMessage: "Thanks for the guitar lesson!",
    time: "Mon",
    unread: 0,
    avatar: "DL",
  },
];

export default function Chat() {
  const [activeChat, setActiveChat] = useState(CHATS[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "other",
      text: "Hi! Are we still on for the carpentry session this afternoon?",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "me",
      text: "Yes, absolutely! I have all the tools ready.",
      time: "10:35 AM",
    },
    {
      id: 3,
      sender: "other",
      text: "Sounds good, see you at 2!",
      time: "10:42 AM",
    },
  ]);

  // Handle changing chats
  const handleChatChange = (chat) => {
    setActiveChat(chat);
    // Reset messages when changing chat to simulate different conversations
    setMessages([
      { id: 1, sender: "other", text: chat.lastMessage, time: chat.time },
    ]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Automatically scroll to bottom could be added here if we set a ref on the ScrollArea content
  };

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Chats Sidebar */}
      <div className="w-80 border-r bg-card/50 flex flex-col h-full flex-shrink-0 hidden md:flex">
        <div className="p-4 border-b flex justify-between items-center bg-card">
          <h2 className="font-semibold text-lg">Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-secondary/50 hover:bg-secondary"
          >
            <Plus className="h-5 w-5 text-secondary-foreground" />
          </Button>
        </div>
        <div className="p-2">
          <Input
            placeholder="Search conversations..."
            className="bg-background h-9 text-sm"
          />
        </div>
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-2 space-y-1">
            {CHATS.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleChatChange(chat)}
                className={`w-full text-left p-3 rounded-xl flex gap-3 items-center transition-colors ${
                  activeChat.id === chat.id ? "bg-primary/10" : "hover:bg-muted"
                }`}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-background">
                    <AvatarFallback
                      className={
                        chat.isGroup
                          ? "bg-blue-100 text-blue-700"
                          : "bg-primary/20 text-primary"
                      }
                    >
                      {chat.avatar}
                    </AvatarFallback>
                  </Avatar>
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background text-[10px] flex items-center justify-center text-white font-bold">
                      {chat.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p
                      className={`font-semibold text-sm truncate ${activeChat.id === chat.id ? "text-primary" : ""}`}
                    >
                      {chat.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {chat.time}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate ${chat.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Active Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Chat Header */}
        <div className="h-16 border-b flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback
                className={
                  activeChat.isGroup
                    ? "bg-blue-100 text-blue-700"
                    : "bg-primary/20 text-primary"
                }
              >
                {activeChat.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{activeChat.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>{" "}
                Online
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6 custom-scrollbar">
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center">
              <span className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full font-medium">
                Today
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${msg.sender === "me" ? "ml-auto justify-end" : ""}`}
              >
                {msg.sender === "other" && (
                  <Avatar className="h-8 w-8 mt-auto shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {activeChat.avatar}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`p-3 px-4 rounded-2xl ${
                    msg.sender === "me"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      msg.sender === "me"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
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
              size="icon"
              className="rounded-full shrink-0 h-10 w-10 bg-primary hover:bg-primary/90 transition-transform active:scale-95"
            >
              <Send className="h-4 w-4 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
