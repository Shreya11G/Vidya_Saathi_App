import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PomodoroProvider } from './contexts/PomodoroContext';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Pomodoro from './pages/Pomodoro';
import AITutor from './pages/AITutor';
import Career from './pages/Career';
import Streaks from './pages/Streaks';
import Links from './pages/Links';
import MemoryGame from './pages/MemoryGame';
import ParagraphWriter from './pages/ParagraphWriter';
import QuizTime from './pages/QuizTime';
import Profile from './pages/Profile';
import QuizUpload from './pages/QuizUpload';
import QuizSetup from './pages/QuizSetup';
import QuizTake from './pages/QuizTake';
import QuizResult from './pages/QuizResult';
import QuizHistory from './pages/QuizHistory';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PomodoroProvider>
        <Router>
          <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-200">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes with Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Tasks />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/notes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Notes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/pomodoro"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Pomodoro />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              
              
              <Route path="/ai-tutor" element={
                <ProtectedRoute>
                  <Layout>
                    <AITutor />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/career" element={
                <ProtectedRoute>
                  <Layout>
                    <Career />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/streaks" element={
                <ProtectedRoute>
                  <Layout>
                    <Streaks />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/links" element={
                <ProtectedRoute>
                  <Layout>
                    <Links />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/memory-game" element={
                <ProtectedRoute>
                  <Layout>
                    <MemoryGame />
                  </Layout>
                </ProtectedRoute>
              } />

               <Route path="/paragraph-writer" element={
                <ProtectedRoute>
                  <Layout>
                    <ParagraphWriter />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/quiz-time" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizTime />
                  </Layout>
                </ProtectedRoute>
              } />


              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />
             
              <Route path="/quiz/upload" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizUpload />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/quiz/setup" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizSetup />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/quiz/take" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizTake />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/quiz/result" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizResult />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/quiz/history" element={
                <ProtectedRoute>
                  <Layout>
                    <QuizHistory />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>

            {/* Global Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg)',
                  color: 'var(--toast-color)',
                  border: '1px solid var(--toast-border)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
          </div>
        </Router>
        </PomodoroProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
