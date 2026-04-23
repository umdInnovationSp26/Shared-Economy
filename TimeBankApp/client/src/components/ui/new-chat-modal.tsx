import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X, Search, Loader2, Users, MessageCircle, Check, ChevronRight, ArrowLeft,
} from "lucide-react";
import {
  collection, query, where, getDocs, doc,
  setDoc, serverTimestamp, getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  uid: string;
  displayName: string; // matches Firestore field name
  email: string;
  photoURL?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Called after a chat is created so the sidebar can select it */
  onChatCreated: (chatId: string) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safe initials for any displayName format:
 * "alice"       → "AL"
 * "Alice Smith" → "AS"
 * ""            → "?"
 */
function getInitials(displayName: string): string {
  if (!displayName) return "?";
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}

/** Deterministic 1-on-1 chat ID — same pair always maps to the same doc. */
function dmChatId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

// ─── UserRow ──────────────────────────────────────────────────────────────────

function UserRow({
  user,selected, onToggle, mode,
}: {
  user: UserProfile;
  selected?: boolean;
  onToggle: (u: UserProfile) => void;
  mode: "dm" | "group";
}) {
  return (
    <button
      onClick={() => onToggle(user)}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors rounded-xl group"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
          {getInitials(user.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left overflow-hidden">
        <p className="font-medium text-sm truncate">{user.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      {mode === "group" && (
        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
          selected 
            ? "bg-primary border-primary" 
            : "border-muted-foreground/30 group-hover:border-primary/50"
        }`}>
          {selected && <Check className="h-3 w-3 text-white" />}
        </div>
      )}
      {mode === "dm" && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      )}
    </button>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function NewChatModal({ open, onClose, onChatCreated }: Props) {
  const currentUser = auth.currentUser;
  const [tab, setTab] = useState<"dm" | "group">("dm");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group state
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<"search" | "name">("search"); // group creation steps

  // Reset on open/tab change
  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    setResults([]);
    setSearchError("");
    setSelectedUsers([]);
    setGroupName("");
    setStep("search");
    setCreating(false);
  }, [open, tab]);

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    if (!searchQuery.trim()) { setResults([]); return; }

    searchRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const usersRef = collection(db, "users");
        const term = searchQuery.trim().toLowerCase();

        // Prefix search on displayNameLower + exact email match, in parallel
        const [byName, byEmail] = await Promise.all([
          getDocs(query(
            usersRef,
            where("displayName", ">=", term),
            where("displayName", "<=", term + "\uf8ff")
          )),
          getDocs(query(usersRef, where("email", "==", term))),
        ]);

        // Merge, dedupe, exclude self
        const map = new Map<string, UserProfile>();
        [...byName.docs, ...byEmail.docs].forEach((d) => {
          if (d.id === currentUser?.uid) return; // exclude self
          const data = d.data();
          map.set(d.id, {
            uid: d.id,
            displayName: data.displayName ?? data.email ?? "Unknown",
            email: data.email ?? "",
            photoURL: data.photoURL,
          });
        });

        setResults(Array.from(map.values()));
      } catch (err) {
        console.error("Search error:", err);
        setSearchError("Search failed. Please try again.");
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [searchQuery, currentUser?.uid]);

  // ── Fetch current user's displayName from Firestore ────────────────────────
  const getMyDisplayName = async (): Promise<string> => {
    if (!currentUser) return "User";
    if (currentUser.displayName) return currentUser.displayName;
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    return snap.data()?.displayName ?? "User";
  };

  // ── DM: create (idempotent) or open a 1-on-1 chat ──────────────────────────
  const handleStartDM = async (otherUser: UserProfile) => {
    if (!currentUser) return;
    setCreating(true);

    try {
      const chatId = dmChatId(currentUser.uid, otherUser.uid);
      const chatRef = doc(db, "chats", chatId);
      const snap = await getDoc(chatRef);

      if (!snap.exists()) {
        const myDisplayName = await getMyDisplayName();

        // memberNames lets each user derive the other person's name client-side
        // by looking up the key that is NOT their own UID.
        await setDoc(chatRef, {
          isGroup: false,
          participantIds: [currentUser.uid, otherUser.uid],
          memberNames: {
            [currentUser.uid]: myDisplayName,
            [otherUser.uid]: otherUser.displayName,
          },
          memberInitials: {
            [currentUser.uid]: getInitials(myDisplayName),
            [otherUser.uid]: getInitials(otherUser.displayName),
          },
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          unread: 0,
        });
      }

      onChatCreated(chatId);
      onClose();
    } catch (err) {
      console.error("Failed to create DM:", err);
      setSearchError("Could not start chat. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  // ── Group: toggle member ────────────────────────────────────────────────────
  const toggleUser = (user: UserProfile) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user],
    );
  };

  // ── Group: create ───────────────────────────────────────────────────────────
  const handleCreateGroup = async () => {
    if (!currentUser || !groupName.trim() || selectedUsers.length < 2) return;
    setCreating(true);

    try {
      const chatId = `group_${Date.now()}_${currentUser.uid}`;
      const myDisplayName = await getMyDisplayName();

      const memberNames: Record<string, string> = { [currentUser.uid]: myDisplayName };
      const memberInitials: Record<string, string> = { [currentUser.uid]: getInitials(myDisplayName) };
      selectedUsers.forEach((u) => {
        memberNames[u.uid] = u.displayName;
        memberInitials[u.uid] = getInitials(u.displayName);
      });

      await setDoc(doc(db, "chats", chatId), {
        isGroup: true,
        name: groupName.trim(),
        groupInitials: groupName.trim().slice(0, 2).toUpperCase(),
        participantIds: [currentUser.uid, ...selectedUsers.map((u) => u.uid)],
        memberNames,
        memberInitials,
        createdBy: currentUser.uid,
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        unread: 0,
      });

      onChatCreated(chatId);
      onClose();
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
            <div className="flex items-center gap-2">
              {tab === "group" && step === "name" && (
                <button onClick={() => setStep("search")} className="mr-1 p-1 rounded-lg hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <h2 className="font-semibold text-base">
                {tab === "dm" ? "New Message" : step === "search" ? "New Group" : "Name your group"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 mx-4 mt-4 mb-1 bg-muted/50 rounded-xl">
            {(["dm", "group"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "dm" ? <MessageCircle className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {t === "dm" ? "Direct Message" : "Group Chat"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="px-4 pb-5">

            {/* GROUP — Step 2: name the group */}
            {tab === "group" && step === "name" ? (
              <div className="pt-4 space-y-5">
                {/* Selected members preview */}
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <div key={u.uid} className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1.5 rounded-full">
                      <span>{u.displayName}</span>
                      <button onClick={() => toggleUser(u)} className="hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Group name input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Group Name</label>
                  <Input
                    autoFocus
                    placeholder="e.g. Community Garden Group"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                    className="h-11"
                  />
                </div>
                <Button onClick={handleCreateGroup} disabled={!groupName.trim() || creating} className="w-full h-11 rounded-xl font-semibold">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                  Create Group · {selectedUsers.length + 1} members
                </Button>
              </div>
            ) : (
              /* DM or GROUP Step 1: search */
              <div className="pt-3 space-y-3">

                {/* Selected chips (group only) */}
                {tab === "group" && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedUsers.map((u) => (
                      <div key={u.uid} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                        <span>{u.displayName}</span>
                        <button onClick={() => toggleUser(u)} className="hover:text-destructive transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    autoFocus
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-11 bg-muted/40 border-muted focus:bg-background transition-colors"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {/* Results */}
                <div className="min-h-[180px] max-h-[280px] overflow-y-auto -mx-1">
                  {searchError ? (
                    <p className="text-center text-sm text-destructive py-8">{searchError}</p>
                  ) : results.length === 0 && searchQuery && !searching ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <Search className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">No users found</p>
                      <p className="text-xs mt-0.5 opacity-70">Try a different name or email</p>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <Search className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">{tab === "dm" ? "Search for someone to message" : "Search for people to add"}</p>
                    </div>
                  ) : (
                    results.map((user) => (
                      <UserRow
                        key={user.uid}
                        user={user}
                        mode={tab}
                        selected={selectedUsers.some((u) => u.uid === user.uid)}
                        onToggle={tab === "dm" ? handleStartDM : toggleUser}
                      />
                    ))
                  )}
                </div>

                {tab === "group" && selectedUsers.length >= 2 && (
                  <Button onClick={() => setStep("name")} className="w-full h-11 rounded-xl font-semibold">
                    Next — Name your group <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {tab === "group" && selectedUsers.length === 1 && (
                  <p className="text-center text-xs text-muted-foreground">Add at least one more person to create a group</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen creating overlay */}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium">Creating chat…</p>
          </div>
        </div>
      )}
    </>
  );
}