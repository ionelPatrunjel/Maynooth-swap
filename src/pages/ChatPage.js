import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  where,
  increment,
} from "firebase/firestore";

const formatTime = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffMs = startOfToday - startOfDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;
  return `${diffDays} days ago, ${timeStr}`;
};

const ChatPage = ({ currentUser, users, items }) => {
  const { chatId: urlChatId } = useParams();

  const sortedId = (...ids) =>
    ids.filter((x) => typeof x === "string" && x.length > 0).sort().join("_");

  const extractOtherId = () => {
    if (!urlChatId || !currentUser) return null;
    const parts = urlChatId.split("_");
    if (parts.length !== 2) return null;
    return currentUser.id === parts[0] ? parts[1] : parts[0];
  };

  const otherUserId = extractOtherId();
  const otherUser = users.find((u) => u.id === otherUserId) || null;

  const computedChatId =
    currentUser && otherUser ? sortedId(currentUser.id, otherUser.id) : null;

  const chatId = computedChatId || urlChatId || "";
  const isValid = chatId && chatId.includes("_");
  const [idA, idB] = isValid ? chatId.split("_") : ["", ""];
  const isSelfChat =
    !!currentUser && !!otherUserId && currentUser.id === otherUserId;

  const [messages, setMessages] = useState([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [text, setText] = useState("");
  const [selectedItemMessageIds, setSelectedItemMessageIds] = useState([]);
  const itemContextHandledRef = useRef(false);

  const searchParams = new URLSearchParams(window.location.search);
  const itemIdParam = searchParams.get("itemId");
  const itemNameParam = searchParams.get("itemName");
  const role = searchParams.get("role");
  const requestId = searchParams.get("requestId");
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (!isValid || isSelfChat || !otherUserId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(arr);
      setMessagesLoaded(true);
    });

    return () => unsub();
  }, [chatId, isValid, isSelfChat, otherUserId]);

  const hasActiveListingContext = (itemId) =>
    messages.some(
      (m) =>
        m.type === "item-card" &&
        m.itemId === itemId &&
        (m.status === "pending" || m.status === "lent")
    );

  const hasActiveRequestContext = (reqId, itemName) =>
    messages.some(
      (m) =>
        m.type === "item-card" &&
        (m.requestId === reqId || m.itemName === itemName) &&
        (m.status === "pending" || m.status === "lent")
    );

  useEffect(() => {
    if (!isValid || isSelfChat || !otherUserId) return;
    if (!messagesLoaded) return;
    if (itemContextHandledRef.current) return;

    const hasListingContext = itemIdParam && mode === "borrow";
    const hasRequestContext = requestId && itemNameParam && role === "owner";

    if (!hasListingContext && !hasRequestContext) return;

    const alreadyHasListingContext =
      hasListingContext && hasActiveListingContext(itemIdParam);
    const alreadyHasRequestContext =
      hasRequestContext && hasActiveRequestContext(requestId, itemNameParam);

    itemContextHandledRef.current = true;

    if (alreadyHasListingContext || alreadyHasRequestContext) return;

    const sendItemContext = async () => {
      await setDoc(
        doc(db, "chats", chatId),
        { users: [idA, idB], lastUpdated: serverTimestamp() },
        { merge: true }
      );

      if (hasListingContext) {
        const item = items.find((i) => i.id === itemIdParam);
        const ownerId = item?.ownerId || null;
        const title = item?.title || "Item";

        await addDoc(collection(db, "chats", chatId, "messages"), {
          type: "item-card",
          itemId: itemIdParam,
          itemName: title,
          itemOwnerId: ownerId,
          fromUserId: currentUser.id,
          direction: "borrow",
          status: "pending",
          createdAt: serverTimestamp(),
          readBy: [currentUser.id],
        });

        await addDoc(collection(db, "chats", chatId, "messages"), {
          fromUserId: currentUser.id,
          text: `I'm enquiring about this item: "${title}".`,
          createdAt: serverTimestamp(),
          readBy: [currentUser.id],
        });
      }

      if (hasRequestContext) {
        await addDoc(collection(db, "chats", chatId, "messages"), {
          type: "item-card",
          itemId: null,
          itemName: itemNameParam,
          itemOwnerId: currentUser.id,
          fromUserId: currentUser.id,
          direction: "lend",
          status: "pending",
          requestId,
          createdAt: serverTimestamp(),
          readBy: [currentUser.id],
        });

        await addDoc(collection(db, "chats", chatId, "messages"), {
          fromUserId: currentUser.id,
          text: `I want to lend you "${itemNameParam}".`,
          createdAt: serverTimestamp(),
          readBy: [currentUser.id],
        });
      }
    };

    sendItemContext();
  }, [
    isValid,
    isSelfChat,
    otherUserId,
    messagesLoaded,
    itemIdParam,
    itemNameParam,
    mode,
    role,
    requestId,
    chatId,
    idA,
    idB,
    currentUser?.id,
    items,
    messages,
  ]);

  useEffect(() => {
    if (!messages.length || !currentUser || !isValid) return;

    const unread = messages.filter(
      (m) =>
        m.fromUserId !== currentUser.id &&
        !(m.readBy || []).includes(currentUser.id)
    );

    unread.forEach((m) => {
      updateDoc(doc(db, "chats", chatId, "messages", m.id), {
        readBy: [...(m.readBy || []), currentUser.id],
      });
    });
  }, [messages, currentUser, chatId, isValid]);

  useEffect(() => {
    if (!currentUser || !otherUserId || !isValid) return;

    const sendAdminMessage = async (text) => {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        fromUserId: "ADMIN_BOT",
        text,
        createdAt: serverTimestamp(),
        readBy: [],
      });
    };

    const checkReminders = async () => {
      const qBorrow = query(
        collection(db, "borrows"),
        where("borrowerId", "==", currentUser.id),
        where("ownerId", "==", otherUserId)
      );

      const snap = await getDocs(qBorrow);
      const now = new Date();

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (!data.dueDate) continue;

        const due = new Date(data.dueDate);
        const diffMs = due - now;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays <= 1 && diffDays > 0 && !data.reminderSent) {
          await sendAdminMessage(
            `Reminder: please return "${data.itemName}" by ${due.toLocaleString()}.`
          );
          await updateDoc(docSnap.ref, { reminderSent: true });
        }

        if (diffDays < 0 && !data.lateNotified) {
          await sendAdminMessage(
            `You are late returning "${data.itemName}". Please return it soon.`
          );
          await updateDoc(docSnap.ref, {
            lateNotified: true,
            status: data.status === "borrowed" ? "late" : data.status,
          });
        }
      }
    };

    checkReminders();
  }, [currentUser, otherUserId, chatId, isValid]);

  const getOwnerIdForCard = (msg) => {
    if (msg.itemOwnerId) return msg.itemOwnerId;
    if (msg.direction === "lend") return msg.fromUserId;
    if (msg.direction === "borrow") return otherUserId;
    return null;
  };

  const getBorrowerIdForCard = (msg) => {
    const ownerId = getOwnerIdForCard(msg);
    if (!ownerId) return null;
    if (ownerId === idA) return idB;
    if (ownerId === idB) return idA;
    return null;
  };

  const isOwnerForCard = (msg) =>
    currentUser && currentUser.id === getOwnerIdForCard(msg);

  const isBorrowerForCard = (msg) =>
    currentUser && currentUser.id === getBorrowerIdForCard(msg);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !isValid || isSelfChat || !otherUserId) return;

    await setDoc(
      doc(db, "chats", chatId),
      { users: [idA, idB], lastUpdated: serverTimestamp() },
      { merge: true }
    );

    await addDoc(collection(db, "chats", chatId, "messages"), {
      fromUserId: currentUser.id,
      text: text.trim(),
      createdAt: serverTimestamp(),
      readBy: [currentUser.id],
    });

    setText("");
  };

  const toggleSelectItemMessage = (id) => {
    setSelectedItemMessageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLendSelected = async () => {
    if (!isValid || isSelfChat || !otherUserId) return;

    const borrowerId = otherUserId;

    const selectedMessages = messages.filter(
      (m) =>
        m.type === "item-card" &&
        selectedItemMessageIds.includes(m.id) &&
        m.status === "pending" &&
        isOwnerForCard(m)
    );

    if (!selectedMessages.length) return;

    for (const msg of selectedMessages) {
      const ownerId = getOwnerIdForCard(msg) || currentUser.id;
      let dueDate = null;
      const itemName = msg.itemName;

      if (msg.itemId) {
        const item = items.find((i) => i.id === msg.itemId);
        if (item?.mustReturn && item?.returnBy) {
          dueDate = item.returnBy;
        }
      } else if (msg.requestId) {
        const reqSnap = await getDoc(doc(db, "requests", msg.requestId));
        if (reqSnap.exists()) {
          const req = reqSnap.data();
          dueDate = req.neededUntil || null;
        }
      }

      await addDoc(collection(db, "borrows"), {
        itemId: msg.itemId || null,
        itemName,
        ownerId,
        borrowerId,
        createdAt: serverTimestamp(),
        dueDate,
        status: "borrowed",
        returnedAt: null,
        wasLate: false,
        reminderSent: false,
        lateNotified: false,
      });

      await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
        status: "lent",
      });

      if (msg.requestId) {
        await updateDoc(doc(db, "requests", msg.requestId), {
          deleted: true,
        });
      }
    }

    await setDoc(
      doc(db, "chats", chatId),
      { lastUpdated: serverTimestamp() },
      { merge: true }
    );

    const itemNames = selectedMessages.map((m) => `"${m.itemName}"`).join(", ");

    await addDoc(collection(db, "chats", chatId, "messages"), {
      fromUserId: currentUser.id,
      text: `I will lend you ${itemNames}.`,
      createdAt: serverTimestamp(),
      readBy: [currentUser.id],
    });

    setSelectedItemMessageIds([]);
  };

  const handleRequestReturnSelected = async () => {
    if (!isValid || isSelfChat || !otherUserId) return;

    const borrowerId = currentUser.id;

    const selectedMessages = messages.filter(
      (m) =>
        m.type === "item-card" &&
        selectedItemMessageIds.includes(m.id) &&
        m.status === "lent" &&
        isBorrowerForCard(m)
    );

    if (!selectedMessages.length) return;

    for (const msg of selectedMessages) {
      await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
        status: "return-requested",
      });

      const ownerId = getOwnerIdForCard(msg);

      const constraints = [
        where("itemName", "==", msg.itemName),
        where("borrowerId", "==", borrowerId),
        where("ownerId", "==", ownerId),
        where("status", "in", ["borrowed", "late"]),
      ];

      if (msg.itemId) {
        constraints.push(where("itemId", "==", msg.itemId));
      }

      const qBorrow = query(collection(db, "borrows"), ...constraints);
      const snap = await getDocs(qBorrow);

      for (const b of snap.docs) {
        await updateDoc(b.ref, { status: "return-requested" });
      }
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      fromUserId: currentUser.id,
      text:
        "I'd like to return: " +
        selectedMessages.map((m) => `${m.itemName}`).join(", "),
      createdAt: serverTimestamp(),
      readBy: [currentUser.id],
    });

    setSelectedItemMessageIds([]);
  };

  const handleConfirmReturnSelected = async () => {
    if (!isValid || isSelfChat || !otherUserId) return;

    const ownerId = currentUser.id;

    const selectedMessages = messages.filter(
      (m) =>
        m.type === "item-card" &&
        selectedItemMessageIds.includes(m.id) &&
        m.status === "return-requested" &&
        isOwnerForCard(m)
    );

    if (!selectedMessages.length) return;

    const now = new Date();

    for (const msg of selectedMessages) {
      await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
        status: "returned",
      });

      const constraints = [
        where("itemName", "==", msg.itemName),
        where("ownerId", "==", ownerId),
        where("status", "==", "return-requested"),
      ];

      if (msg.itemId) constraints.push(where("itemId", "==", msg.itemId));

      const qBorrow = query(collection(db, "borrows"), ...constraints);
      const snap = await getDocs(qBorrow);

      for (const b of snap.docs) {
        const data = b.data();
        let wasLate = false;

        if (data.dueDate) {
          const due = new Date(data.dueDate);
          wasLate = now > due;
        }

        await updateDoc(b.ref, {
          status: "returned",
          returnedAt: serverTimestamp(),
          wasLate,
        });

        if (wasLate) {
          await updateDoc(doc(db, "users", data.borrowerId), {
            lateReturns: increment(1),
          });
        }
      }
    }

    await addDoc(collection(db, "chats", chatId, "messages"), {
      fromUserId: currentUser.id,
      text:
        "Return confirmed for " +
        selectedMessages.map((m) => `"${m.itemName}"`).join(", "),
      createdAt: serverTimestamp(),
      readBy: [currentUser.id],
    });

    setSelectedItemMessageIds([]);
  };

  const handleCancelRequest = async (msg) => {
    if (!isValid || isSelfChat || !otherUserId) return;
    if (msg.status !== "pending") return;

    await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
      status: "cancelled",
    });

    await setDoc(
      doc(db, "chats", chatId),
      { lastUpdated: serverTimestamp() },
      { merge: true }
    );

    await addDoc(collection(db, "chats", chatId, "messages"), {
      fromUserId: currentUser.id,
      text: `I cancelled my request for "${msg.itemName}".`,
      createdAt: serverTimestamp(),
      readBy: [currentUser.id],
    });

    setSelectedItemMessageIds((prev) => prev.filter((id) => id !== msg.id));
  };

  if (!isValid) {
    return (
      <div className="app-container">
        <div className="card">
          <p>Invalid chat.</p>
        </div>
      </div>
    );
  }

  if (isSelfChat) {
    return (
      <div className="app-container">
        <div className="card">
          <p>You cannot chat with yourself.</p>
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="app-container">
        <div className="card">
          <p>User not found.</p>
        </div>
      </div>
    );
  }

  const hasLendableCards = messages.some(
    (m) => m.type === "item-card" && m.status === "pending" && isOwnerForCard(m)
  );

  const hasReturnableCards = messages.some(
    (m) =>
      m.type === "item-card" &&
      m.status === "lent" &&
      isBorrowerForCard(m)
  );

  const hasConfirmableReturns = messages.some(
    (m) =>
      m.type === "item-card" &&
      m.status === "return-requested" &&
      isOwnerForCard(m)
  );

  return (
    <div className="app-container">
      <div className="card">
        <h2>Chat</h2>
        <p>
          Chat with:{" "}
          <Link
            to={`/users/${otherUser.id}`}
            style={{ textDecoration: "underline", color: "#2563eb" }}
          >
            {otherUser.name}
          </Link>{" "}
          ({otherUser.email})
        </p>

        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 8,
            height: 260,
            overflowY: "auto",
            marginTop: 8,
          }}
        >
          {messages.map((m) => {
            if (m.fromUserId === "ADMIN_BOT") {
              return (
                <div
                  key={m.id}
                  style={{
                    textAlign: "center",
                    marginTop: 6,
                    fontSize: 12,
                    opacity: 0.8,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "4px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              );
            }

            if (m.type === "item-card") {
              const ownerView = isOwnerForCard(m);
              const borrowerView = isBorrowerForCard(m);
              const isSelected = selectedItemMessageIds.includes(m.id);

              const label =
                m.direction === "borrow"
                  ? `${
                      otherUserId === m.fromUserId
                        ? otherUser?.name
                        : currentUser.name
                    } wants to borrow:`
                  : "Lending offer:";

              const canCancel = m.status === "pending" && !ownerView;

              const canSelectForLend =
                ownerView && m.status === "pending";

              const canSelectForReturn =
                borrowerView && m.status === "lent";

              const canSelectForConfirmReturn =
                ownerView && m.status === "return-requested";

              let borderColor = "#e5e7eb";
              let bgColor = "#f9fafb";

              if (m.status === "lent") {
                borderColor = "#22c55e";
                bgColor = "#ecfdf3";
              } else if (m.status === "cancelled") {
                borderColor = "#f97316";
                bgColor = "#fff7ed";
              } else if (m.status === "return-requested") {
                borderColor = "#f59e0b";
                bgColor = "#fffbeb";
              } else if (m.status === "returned") {
                borderColor = "#22c55e";
                bgColor = "#dcfce7";
              }

              return (
                <div
                  key={m.id}
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      padding: 10,
                      borderRadius: 10,
                      border: `1px solid ${borderColor}`,
                      backgroundColor: bgColor,
                      minWidth: 220,
                    }}
                  >
                    <p style={{ fontSize: 12, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontWeight: "bold", marginBottom: 4 }}>
                      {m.itemName}
                    </p>
                    <p style={{ fontSize: 12, marginBottom: 2 }}>
                      Status:{" "}
                      {m.status === "lent"
                        ? "Lent"
                        : m.status === "cancelled"
                        ? "Cancelled"
                        : m.status === "return-requested"
                        ? "Return requested"
                        : m.status === "returned"
                        ? "Returned"
                        : "Pending"}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        marginTop: 2,
                      }}
                    >
                      {formatTime(m.createdAt)}
                    </p>

                    {(canSelectForLend ||
                      canSelectForReturn ||
                      canSelectForConfirmReturn) && (
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          textAlign: "left",
                        }}
                      >
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItemMessage(m.id)}
                          />
                          <span>
                            {canSelectForLend &&
                              !canSelectForReturn &&
                              !canSelectForConfirmReturn &&
                              "Select to lend"}
                            {canSelectForReturn &&
                              !canSelectForLend &&
                              !canSelectForConfirmReturn &&
                              "Select to request return"}
                            {canSelectForConfirmReturn &&
                              "Select to confirm return"}
                          </span>
                        </label>
                      </div>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => handleCancelRequest(m)}
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: "none",
                          backgroundColor: "#ef4444",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Cancel request
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems:
                    m.fromUserId === currentUser.id
                      ? "flex-end"
                      : "flex-start",
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    backgroundColor:
                      m.fromUserId === currentUser.id
                        ? "#3b82f6"
                        : "#e5e7eb",
                    color:
                      m.fromUserId === currentUser.id
                        ? "white"
                        : "black",
                    display: "inline-block",
                    maxWidth: "80%",
                    wordBreak: "break-word",
                  }}
                >
                  {m.text}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    marginTop: 2,
                  }}
                >
                  {formatTime(m.createdAt)}
                </span>
              </div>
            );
          })}
        </div>

        {hasLendableCards && (
          <div style={{ marginTop: 8 }}>
            <button
              className="button"
              type="button"
              onClick={handleLendSelected}
              style={{
                fontSize: 13,
                opacity: selectedItemMessageIds.length === 0 ? 0.6 : 1,
                cursor:
                  selectedItemMessageIds.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={selectedItemMessageIds.length === 0}
            >
              Lend selected items
            </button>
          </div>
        )}

        {hasReturnableCards && (
          <div style={{ marginTop: 8 }}>
            <button
              className="button"
              type="button"
              onClick={handleRequestReturnSelected}
              style={{
                fontSize: 13,
                backgroundColor: "#f59e0b",
                opacity: selectedItemMessageIds.length === 0 ? 0.6 : 1,
                cursor:
                  selectedItemMessageIds.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={selectedItemMessageIds.length === 0}
            >
              Request return for selected
            </button>
          </div>
        )}

        {hasConfirmableReturns && (
          <div style={{ marginTop: 8 }}>
            <button
              className="button"
              type="button"
              onClick={handleConfirmReturnSelected}
              style={{
                fontSize: 13,
                backgroundColor: "#22c55e",
                opacity: selectedItemMessageIds.length === 0 ? 0.6 : 1,
                cursor:
                  selectedItemMessageIds.length === 0
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={selectedItemMessageIds.length === 0}
            >
              Confirm selected returns
            </button>
          </div>
        )}

        <form onSubmit={send} style={{ marginTop: 10 }}>
          <input
            className="input"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="button" style={{ marginTop: 6 }}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
