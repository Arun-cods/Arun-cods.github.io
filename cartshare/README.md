# CartShare — Collaborative Shopping Ecosystem

> **Course Project Submission**  
> **Author:** Gopagani Arun  
> **GitHub:** [@Arun-cods](https://github.com/Arun-cods)  
> **Submission Format:** `BatchID_FullName_CartShare` (e.g., `FSWD2026_GopaganiArun_CartShare`)

---

## 1. The Real-World Problem (Why CartShare?)

In shared living spaces (student dorms, co-living apartments, office teams, and travel groups), ordering groceries and shared supplies online is usually chaotic:

1. **The Communication Gap:** Groups rely on fragmented tools (WhatsApp messages, sticky notes, spreadsheets), leading to duplicate purchases, forgotten essentials, and endless confusion.
2. **The Delivery Threshold Trap:** Major grocery and delivery platforms require a minimum basket total (e.g. **$75.00**) to qualify for **Free Shipping**. When roommates order individually, everyone pays unnecessary delivery fees ($5.99+). Coordinating orders manually to cross that threshold is frustrating.
3. **Lack of Transparency & Split Headaches:** When the order arrives, calculating who owes what is tedious and error-prone because it’s hard to track who added which specific item.

---

## 2. The Solution: CartShare

**CartShare** transforms joint purchasing into an effortless, collaborative experience:

- 🔑 **Instant Room Access:** Create or join a unique 6-character room code (e.g., `K7X2M9`) or join directly via shareable URL hash.
- 🛒 **Real-Time Shared Cart:** Add or remove items with live quantity and price calculations.
- 🏷️ **Member Attribution:** Every item displays the participant's name with an avatar badge, ensuring full accountability.
- 🚚 **Delivery Threshold Tracker:** An interactive progress bar tracks the group basket against the **$75.00 Free Shipping threshold**, alerting the team how much is left to save on delivery fees.
- ⚖️ **Automatic Expense Splitting:** Real-time audit breakdown showing each person's exact subtotal (and their proportional share of delivery fee if threshold isn't met).
- 📜 **Live Activity Log:** Real-time feed recording who joined, added, or removed items with timestamps.
- 🖨️ **Audit-Ready Printable Receipt:** Formatted using CSS print media rules (`@media print`) and JavaScript `window.print()` to generate an invoice for the entire group.

---

## 3. Technical Architecture & Implementation

| Requirement | Implementation Details |
|---|---|
| **User Access** | HTML5 forms with client validation for user login and room generation/joining. |
| **Responsive UI** | Built with **Bootstrap 5.3**, custom **CSS Flexbox**, and **CSS Grid** to guarantee smooth experience across mobile, tablet, and desktop screens. |
| **Data Persistence** | Scoped `localStorage` keys per room (`cartshare_cart_<ROOM>` and `cartshare_log_<ROOM>`) keep items safe across page reloads. |
| **Real-Time Collaboration** | Native **`BroadcastChannel` API** complemented by a **`window.onstorage`** fallback to instantaneously sync additions, deletions, and logs across browser tabs and windows without external servers. |
| **Print Media Formatting** | Tailored `@media print` stylesheet strips out buttons, inputs, and UI clutter, creating a receipt suitable for physical printing or PDF export. |

---

## 4. Project Folder Structure

Adheres strictly to the course syllabus requirements:

```
CartShare/
├── index.html              # Main application interface and receipt modal
├── css/
│   └── styles.css          # Custom styling, animations, responsive tweaks & @media print rules
├── js/
│   ├── storageSync.js      # Unified BroadcastChannel & storage event sync engine
│   ├── activityLog.js      # Activity tracking, logging, and rendering
│   ├── cart.js             # Cart data model, $75 threshold logic, expense split, and receipt
│   └── room.js             # Room code generation, join logic, URL hash, and session management
├── assets/
│   └── logo.svg            # Custom SVG branding icon
└── README.md               # Project documentation and setup guide
```

---

## 5. Local Setup & Testing Instructions

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
- Python 3 installed (or any local static file server).

### Steps to Run Locally

1. **Clone or navigate into the repository directory:**
   ```bash
   cd CartShare
   ```

2. **Start a local HTTP server:**
   ```bash
   # Using Python 3:
   python -m http.server 8000
   ```

3. **Open the application:**
   Visit [`http://localhost:8000`](http://localhost:8000) in your browser.

4. **Testing Multi-User Collaboration:**
   - Open **Tab 1**: Enter name `Arun`, click **Create New Room**. Note the 6-character room code (or copy the share link).
   - Open **Tab 2** (or another browser window / incognito): Enter name `Priya`, paste the room code, and click **Join**.
   - Add items from either tab (e.g., Milk, Cereal, Bread). Watch both tabs update their cart, threshold bar, and activity log **in real time**.
   - Review the **Expense Split per Person** card to see the amounts owed.
   - Click **Review & Print Receipt** and choose **Print / Save PDF** to generate an invoice.

---

## 6. Live Deployment

The project is hosted and accessible via **GitHub Pages**:
- **Live URL (GitHub Pages):** [https://arungopagani.is-a.dev/CartShare/](https://arungopagani.is-a.dev/CartShare/) *(or [https://arun-cods.github.io/CartShare/](https://arun-cods.github.io/CartShare/))*
- **GitHub Repository:** [https://github.com/Arun-cods/CartShare](https://github.com/Arun-cods/CartShare)

---

## 7. Author Information

- **Developer:** Gopagani Arun
- **GitHub Profile:** [https://github.com/Arun-cods](https://github.com/Arun-cods)
- **Email:** gopaganiarungoud@gmail.com
- **Project Name:** CartShare Collaborative Shopping Ecosystem
