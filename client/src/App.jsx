import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import Login from "./components/Login";
import Tabs from "./components/Tabs";
import TaskList from "./components/TaskList";
import Leaderboard from "./components/Leaderboard";
import AddTaskModal from "./components/AddTaskModal";

export default function App() {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [taskData, setTaskData] = useState({ owner: null, tasks: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadUsers = useCallback(async (tkn) => {
    const data = await api.getUsers(tkn);
    setUsers(data.users);
    if (!activeId && data.users.length) setActiveId(data.users[0].id);
  }, [activeId]);

  const loadLeaderboard = useCallback(async (tkn) => {
    const data = await api.getLeaderboard(tkn);
    setLeaderboard(data.leaderboard);
  }, []);

  const loadTasks = useCallback(async (ownerId, tkn) => {
    if (!ownerId) return;
    const data = await api.getTasks(ownerId, tkn);
    setTaskData(data);
  }, []);

  useEffect(() => {
    loadUsers(token);
    loadLeaderboard(token);
  }, [token]); // eslint-disable-line

  useEffect(() => {
    loadTasks(activeId, token);
  }, [activeId, token]); // eslint-disable-line

  function handleAuth(tkn, user) {
    setToken(tkn);
    setMe(user);
  }

  function logout() {
    setToken(null);
    setMe(null);
  }

  async function confirmCross(taskId) {
    try {
      await api.confirmCross(taskId, token);
      await Promise.all([loadTasks(activeId, token), loadLeaderboard(token), loadUsers(token)]);
    } catch (err) {
      alert(err.message);
    }
  }

  async function createTask(title, url) {
    await api.createTask(title, url, token);
    if (activeId === me.id) await loadTasks(activeId, token);
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-ink/10 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-bold text-ink">Chéo Tương Tác</h1>
        {me ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink/70">
              Xin chào, <b>{me.fullName}</b>
            </span>
            <button onClick={logout} className="text-red-500 underline">
              Đăng xuất
            </button>
          </div>
        ) : (
          <span className="text-sm text-ink/40">Chưa đăng nhập</span>
        )}
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {!token ? (
          <Login onAuth={handleAuth} />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Tabs users={users} activeId={activeId} onSelect={setActiveId} />
              <button
                onClick={() => setShowAdd(true)}
                className="ml-3 shrink-0 bg-mint text-white text-sm px-4 py-2 rounded-full font-medium"
              >
                + Thêm nhiệm vụ
              </button>
            </div>

            {taskData.owner && (
              <div>
                <h2 className="text-sm text-ink/50 mb-2">
                  Nhiệm vụ của {taskData.owner.label}
                </h2>
                <TaskList owner={taskData.owner} tasks={taskData.tasks} onConfirm={confirmCross} />
              </div>
            )}

            <Leaderboard leaderboard={leaderboard} />
          </div>
        )}
      </main>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onCreate={createTask} />}
    </div>
  );
}
