# ContestHub - Creative Contest Management Platform

### 
🔗 [🌐 Live Link](https://contest-creation-assignment-11.netlify.app)

## 🚀 Overview
**ContestHub** is a production-ready, full-stack web application that revolutionizes how creative contests are managed. It serves as a bridge between **Contest Creators**, who want to host design, writing, or gaming challenges, and **Participants**, who compete to win prizes.

With a secure and user-friendly interface, ContestHub handles everything from authentication and payments to submission management and winner declaration.

## ✨ Key Features (10+ Points)
1.  **🔐 Secure Authentication**: robust system using **Firebase Auth** supporting both Email/Password and **Google Sign-in**.
2.  **👑 Role-Based Access Control (RBAC)**: Distinct dashboards and permissions for **Admins**, **Contest Creators**, and **Users**.
3.  **💳 Stripe Payment Integration**: Seamless and secure payment gateway for participants to pay entry fees and join contests.
4.  **🖌️ Comprehensive Contest Creation**: Creators can post contests with detailed descriptions, price, prize money, tags, and deadlines using **React Datepicker**.
5.  **🏆 Dynamic Leaderboard**: Real-time ranking of top winners, motivating users to participate more.
6.  **🔍 Advanced Search & Sorting**: Users can search contests by tags and filter them by specific categories (e.g., Image Design, Article Writing).
7.  **📱 Fully Responsive Design**: A "Mobile-First" approach ensuring a flawless experience across Phones, Tablets, and Desktops using **Tailwind CSS** & **DaisyUI**.
8.  **⚡ Optimized Performance**: Utilizes **TanStack Query** for efficient data fetching, caching, and synchronization.
9.  **📝 Submission & Winner System**: Participants submit task links, and Creators can view submissions and declare a winner with a single click.
10. **✨ Engaging UI/UX**: Enhanced with **Framer Motion** for smooth entrances, hover effects, and page transitions.
11. **📊 Smart Dashboards**:
    *   **Admin**: Manage users & approve/reject contests.
    *   **Creator**: Track submission status and manage created contests.
    *   **User**: View winning history and participation progress.
12. **🔔 Interactive Feedback**: Uses **SweetAlert2** for beautiful success/error popups and toast notifications.

## 🛠️ Technology Stack
### Client
*   **React.js** (Vite)
*   **React Router DOM**
*   **Tailwind CSS** + **DaisyUI**
*   **Framer Motion**
*   **TanStack Query** (React Query)
*   **React Hook Form**
*   **Axios** (with Interceptors)
*   **Firebase Authentication**

### Server
*   **Node.js**
*   **Express.js**
*   **MongoDB** (Mongoose)
*   **JWT** (JSON Web Token)
*   **Stripe SDK**

## 🚀 Getting Started
🔗 [Server Repository.](https://github.com/fardin-sojon/contest-creation-server-assignment-11.git)

## ⚙️ Local Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/fardin-sojon/contest-creation-client-assignment-11-.git
    
    cd contest-creation-client-assignment-11
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file and add your keys:
    ```env
    VITE_apiKey=YOUR_FIREBASE_API_KEY
    VITE_authDomain=YOUR_FIREBASE_AUTH_DOMAIN
    VITE_projectId=YOUR_FIREBASE_PROJECT_ID
    # ... other firebase config
    VITE_API_URL=http://localhost:5000
    VITE_PAYMENT_GATEWAY_PK=YOUR_STRIPE_PK
    ```
4.  **Run Locally**:
    ```bash
    npm run dev
    nodemon index.js
    ```

---
*© 2025 ContestHub. Developed by Fardin Rahman Sojon.*
