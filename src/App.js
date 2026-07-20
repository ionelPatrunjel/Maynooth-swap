import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ListItemPage from "./pages/ListItemPage";
import ItemDetailsPage from "./pages/ItemDetailsPage";
import RequestItemPage from "./pages/RequestItemPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import LeaveReviewPage from "./pages/LeaveReviewPage";
import RequestBoardPage from "./pages/RequestBoardPage";
import ChatPage from "./pages/ChatPage";
import MessagesPage from "./pages/MessagesPage";
import RegisterPage from "./pages/RegisterPage";

import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { onAuthStateChanged, signOut } from "firebase/auth";

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [unreadCount, setUnreadCount] = useState(0);
  const chatUnsubsRef = useRef({});
  const unreadPerChatRef = useRef({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);

      if (!user) {
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setCurrentUser({ id: user.uid, ...snap.data() });
        } else {
          const profile = {
            name: user.displayName || "",
            email: user.email,
            rating: 0,
            reviews: [],
            lateReturns: 0,
          };
          await setDoc(ref, profile);
          setCurrentUser({ id: user.uid, ...profile });
        }
      } catch (e) {
        console.error("Auth restore failed:", e);
      }
      
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubItems = onSnapshot(collection(db, "items"), (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubBorrows = onSnapshot(collection(db, "borrows"), (snap) => {
      setBorrows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubRequests = onSnapshot(collection(db, "requests"), (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubUsers();
      unsubItems();
      unsubBorrows();
      unsubRequests();
    };
  }, []);

  useEffect(() => {
    Object.values(chatUnsubsRef.current).forEach((fn) => fn && fn());
    chatUnsubsRef.current = {};
    unreadPerChatRef.current = {};
    setUnreadCount(0);

    if (!currentUser) return;

    const qChats = query(
      collection(db, "chats"),
      where("users", "array-contains", currentUser.id)
    );

    const unsubChats = onSnapshot(qChats, (chatSnap) => {
      const active = new Set();

      chatSnap.forEach((c) => {
        const chatId = c.id;
        active.add(chatId);

        if (!chatUnsubsRef.current[chatId]) {
          const unsubMsgs = onSnapshot(
            collection(db, "chats", chatId, "messages"),
            (msgSnap) => {
              let count = 0;

              msgSnap.forEach((m) => {
                const data = m.data();
                if (
                  data.fromUserId !== currentUser.id &&
                  !(data.readBy || []).includes(currentUser.id)
                ) {
                  count++;
                }
              });

              unreadPerChatRef.current[chatId] = count;

              let total = 0;
              Object.values(unreadPerChatRef.current).forEach((c) => {
                total += c;
              });

              setUnreadCount(total);
            }
          );

          chatUnsubsRef.current[chatId] = unsubMsgs;
        }
      });

      Object.keys(chatUnsubsRef.current).forEach((chatId) => {
        if (!active.has(chatId)) {
          chatUnsubsRef.current[chatId]();
          delete chatUnsubsRef.current[chatId];
          delete unreadPerChatRef.current[chatId];
        }
      });

      let total = 0;
      Object.values(unreadPerChatRef.current).forEach((c) => (total += c));
      setUnreadCount(total);
    });

    return () => {
      unsubChats();
      Object.values(chatUnsubsRef.current).forEach((fn) => fn && fn());
      chatUnsubsRef.current = {};
      unreadPerChatRef.current = {};
    };
  }, [currentUser]);

  const handleLogout = async () => {
    setAuthLoading(true);
    await signOut(auth);
    setCurrentUser(null);
    setAuthLoading(false);
  };

  const deleteItemInDb = async (itemId) => {
    await deleteDoc(doc(db, "items", itemId));
  };

  const addBorrowRecord = async (itemId, ownerId, borrowerId) => {
    await addDoc(collection(db, "borrows"), {
      itemId,
      ownerId,
      borrowerId,
      createdAt: new Date().toISOString(),
    });
  };

  if (loading || authLoading)
    return <p style={{ padding: 20 }}>Loading…</p>;

  return (
    <>
      {location.pathname !== "/login" &&
        location.pathname !== "/register" && (
          <Navbar
            currentUser={currentUser}
            onLogout={handleLogout}
            unreadCount={unreadCount}
          />
        )}

      <Routes>
        <Route path="/login" element={<LoginPage authLoading={authLoading} />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute user={currentUser}>
              <HomePage
                items={items}
                users={users}
                requests={requests}
                currentUser={currentUser}
                borrows={borrows}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/list"
          element={
            <ProtectedRoute user={currentUser}>
              <ListItemPage currentUser={currentUser} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/messages"
          element={
            <ProtectedRoute user={currentUser}>
              <MessagesPage currentUser={currentUser} users={users} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/items/:id"
          element={
            <ProtectedRoute user={currentUser}>
              <ItemDetailsPage
                items={items}
                users={users}
                currentUser={currentUser}
                onBorrow={addBorrowRecord}
                onDeleteItem={deleteItemInDb}
                borrows={borrows}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/request/:id"
          element={
            <ProtectedRoute user={currentUser}>
              <RequestItemPage items={items} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute user={currentUser}>
              <RequestBoardPage
                currentUser={currentUser}
                users={users}
                requests={requests}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute user={currentUser}>
              <ChatPage
                currentUser={currentUser}
                users={users}
                items={items}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={currentUser}>
              <ProfilePage
                currentUser={currentUser}
                items={items}
                borrows={borrows}
                users={users}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users/:id"
          element={
            <ProtectedRoute user={currentUser}>
              <UserProfilePage
                users={users}
                items={items}
                borrows={borrows}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review/:id"
          element={
            <ProtectedRoute user={currentUser}>
              <LeaveReviewPage currentUser={currentUser} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default AppWrapper;
