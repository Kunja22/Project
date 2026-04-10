import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Dashboard() {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'pending' });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, navigate, authLoading]);

  // Configure axios to always send token
  const config = {
    headers: {
      Authorization: `Bearer ${user?.token}`,
    },
  };

  useEffect(() => {
    if (!user) return;
    
    const fetchTasks = async () => {
      try {
        const res = await axios.get('/api/tasks', config);
        setTasks(res.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks', error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      const res = await axios.post('/api/tasks', formData, config);
      setTasks([...tasks, res.data]);
      setFormData({ title: '', description: '', status: 'pending' });
    } catch (error) {
      console.error('Error adding task', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`/api/tasks/${id}`, config);
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (error) {
      console.error('Error deleting task', error);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      const res = await axios.put(`/api/tasks/${task._id}`, { ...task, status: newStatus }, config);
      setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
    } catch (error) {
      console.error('Error updating task', error);
    }
  };

  if (authLoading || loading) return <div className="loader"></div>;

  return (
    <div>
      <div className="dashboard-header">
        <h2>Your Tasks</h2>
      </div>

      <div className="task-form">
        <h3 style={{ marginBottom: '1rem' }}>Create New Task</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="title"
              className="form-control"
              placeholder="Task Title"
              value={formData.title}
              onChange={onChange}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              name="description"
              className="form-control"
              placeholder="Task Description"
              value={formData.description}
              onChange={onChange}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">Add Task</button>
          </div>
        </form>
      </div>

      {tasks.length > 0 ? (
        <div className="task-grid">
          {tasks.map((task) => (
            <div key={task._id} className="task-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <div className="task-footer">
                <span className={`status-badge status-${task.status}`}>
                  {task.status}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => toggleStatus(task)} 
                      className={`btn ${task.status === 'pending' ? 'btn-outline' : 'btn-primary'}`}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      {task.status === 'pending' ? 'Complete' : 'Reopen'}
                    </button>
                    <button 
                      onClick={() => deleteTask(task._id)} 
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <h3>No tasks found</h3>
          <p>Create your first task above to get started!</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
