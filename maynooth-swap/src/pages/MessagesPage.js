import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { getChatId } from "../utils/chat";

const MessagesPage = ({ currentUser, users }) => {
  const [partners, setPartners] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    let messageUnsubs = [];

    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.id)
    );

    const unsubChats = onSnapshot(q, (snap) => {
      messageUnsubs.forEach((fn) => fn());
      messageUnsubs = [];

      const partnerIds = new Set();
      const unreadMap = {};

      snap.forEach((docSnap) => {
        const chatId = docSnap.id;
        const data = docSnap.data();

        if (Array.isArray(data.users)) {
          data.users.forEach((uid) => {
            if (uid !== currentUser.id) partnerIds.add(uid);
          });
        }

        const msgsRef = collection(db, "chats", chatId, "messages");

        const unsubMsgs = onSnapshot(msgsRef, (msgSnap) => {
          let count = 0;

          msgSnap.forEach((m) => {
            const d = m.data();
            if (d.fromUserId !== currentUser.id && !(d.readBy || []).includes(currentUser.id)) {
              count++;
            }
          });

          unreadMap[chatId] = count;
          setUnreadCounts({ ...unreadMap });
        });

        messageUnsubs.push(unsubMsgs);
      });

      const result = users.filter((u) => partnerIds.has(u.id));
      setPartners(result);
    });

    return () => {
      unsubChats();
      messageUnsubs.forEach((fn) => fn());
    };
  }, [currentUser, users]);

  return (
    <div className="app-container">
      <div className="card">
        <h2>Messages</h2>

        {partners.length === 0 && <p>No conversations yet.</p>}

        {partners.map((u) => {
          const chatId = getChatId(currentUser.id, u.id);
          const unread = unreadCounts[chatId] || 0;

          return (
            <Link
              key={u.id}
              to={`/chat/${chatId}`}
              style={{ textDecoration: "none", color: "black" }}
            >
              <div
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #eee"
                }}
              >
                <strong>{u.name}</strong>
                <p style={{ fontSize: 13 }}>{unread > 0 ? (
                  <span style={{ fontWeight: "bold" }}>
                    {unread} new message{unread > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span>No new messages</span>
                )}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MessagesPage;
