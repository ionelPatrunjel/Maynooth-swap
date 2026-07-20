README.md
Maynooth Swap – A Sustainable Borrowing Platform

Maynooth Swap is a mobile-style web application built using React and Firebase, designed to support a more sustainable environment by encouraging re-use, borrowing, and sharing within a community.
Instead of buying new items, users can borrow, lend, request, and swap items – reducing waste, lowering consumption, and strengthening local sustainability habits.

📱 Core Features
🔐 Authentication

User registration & login

Simple local authentication system

User profiles with ratings & reviews

🎒 Item Sharing & Borrowing

Users can list items they own

Items can be requested or borrowed directly

Items can require a return date

System prevents borrowing items already lent out

Live “late return” detection via due dates

📝 Item Requests System

Users can request items they need

Requests appear on a community board

Item owners can start a chat directly from a request

Requests auto-close when fulfilled

💬 Real-Time Messaging

Built using Firebase Firestore real-time updates:

One-to-one messaging between users

Automated “item-card” messages that track:

Borrow requests

Lending offers

Return requests

Return confirmations

Messages instantly update without refreshing

🔔 Unread Messages Badge

Every chat tracks unread messages

Unread count appears beside the Messages button in the navbar

Updates live as messages are read

♻ Sustainability Logic

The app explicitly supports environmental sustainability by:

Reducing unnecessary purchases

Encouraging sharing over consumption

Extending item lifespan

Tracking responsible borrowing (late returns increase a user’s “lateReturns”)

📂 Pages & Navigation
Home Page

Search items

Filter by category

View only available (not lent-out) items

Shows item age (“Posted today”, etc.)

List Item Page

Add new items with title, description, image (optional), return settings

Request Board

Shows active community requests

Owners can chat or offer items instantly

Profile Page

Your items

Items you've borrowed

Late return record

Reviews received

Leave reviews for others

Messages Page

Shows all conversations

Displays unread counts per chat

Chat Page

Full real-time messaging

Borrow/lend status logic

System-generated contextual cards

Book-like timeline of interactions

🧠 Technical Features Used (meets CS385 requirements)

This project includes all of the required project capabilities:

Using an API (Firebase Firestore API)

Using a database

External JSON data (Firestore snapshots)

Conditional rendering everywhere (cards, chats, nav)

Sorting, filtering, searching (Home & Requests pages)

Multiple UI elements (inputs, selects, badges, cards)

Parent–child communication (props for unread count, items, users)

Multiple components (20+ components)

React Router (full routing system)

Custom algorithms:

Chat ID generation

Late return detection

Borrow status transitions

Unread message tracking

🛠 Tech Stack

React (recommended by module)

Firebase Firestore

Firebase Real-Time Listeners

React Router

Modern CSS (Revolut-inspired UI)

📹 Screencast Requirements (Your Video Should Show)

Use this in your nose to make the 5–7 minute video:

App introduction + purpose (sustainable environment)

Register & login

Listing an item

Requesting an item

Starting a chat

Borrow → Return → Confirm return flow

Unread messages badge updating

Searching & filtering

Profile & reviews

Code walkthrough (chat logic + Firebase listeners)

📦 How to Run

Install dependencies

npm install


Start development server

npm start


App runs on

http://localhost:3000


Firebase config must be placed in
/src/firebase.js
with your own project credentials.

👥 Author

Ion Plesca
CS385 Mobile Application Development
Maynooth University

📘 License

This project is for educational use under CS385 and should not be distributed without permission.