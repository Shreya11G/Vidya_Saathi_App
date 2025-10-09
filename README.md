
# VidyaSaathi – GenAI-Powered Learning & Career Companion (Web App)

**Tech Stack:** ReactJS, Tailwind CSS, Node.js, Express.js, MongoDB, Gemini API, JWT (HTTP-only)

---

## Description
VidyaSathi is a full-stack web application that provides **AI-powered tutoring**, personalized study planning, and career guidance for students in rural and Tier 2/3 India. The app leverages AI to help students plan their studies, track progress, and get career advice seamlessly through a **conversational interface**.

This project is **actively being enhanced** with additional features and technologies to improve performance, scalability, and user experience.

---

## Features
- AI-powered tutoring and career guidance using **Gemini API**.
- Personalized learning paths and progress tracking.
- Secure authentication using **JWT with HTTP-only cookies**.
- Modular, user-centric interface with minimal typing and large dashboard controls.
- Backend built with **Node.js** and **Express.js**; data stored in **MongoDB**.
- Designed for accessibility in **low-bandwidth environments**.

---

## Folder Structure
```

VidyaSathi/
├─ client/        # Frontend (ReactJS + Tailwind)
├─ server/        # Backend (Node.js + Express.js + MongoDB)
├─ .gitignore
└─ README.md

````

---

## Installation

### Prerequisites
- Node.js and npm installed
- MongoDB instance (local or cloud)
- Gemini API credentials

### Steps
1. Clone the repository:
```bash
git clone https://github.com/Shreya11G/VidyaSaathi.git
cd VidyaSaathi
````

2. **Backend setup:**

```bash
cd server
npm install
```

* Create a `.env` file with your environment variables (MongoDB URI, JWT secret, Gemini API key)

```env
MONGODB_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

* Start the server:

```bash
npm run dev 
```

3. **Frontend setup:**

```bash
cd ../client
npm install
npm run dev 
```

* Open your browser at `http://localhost:5173` to see the app running.

---

## Usage

* Sign up / log in to access your dashboard.
* Explore AI tutoring and career guidance.
* Track your learning progress and personalized study plans.

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to enhance features, performance, and scalability.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

## Screenshots

<img width="1900" height="905" alt="image" src="https://github.com/user-attachments/assets/6ed52743-3443-4dc0-8472-76fb71ba375e" />


```

