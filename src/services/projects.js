import api from './api';

export const listProjects = () => api.get('/projects');

export const createProject = ({ name, description }) => api.post('/projects', {
  name,
  description,
});

export const getProject = (projectId) => api.get(`/projects/${projectId}`);

export const uploadProjectFile = (projectId, formData) => api.post(
  `/projects/${projectId}/files`,
  formData,
  {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
);

export const listProjectFiles = (projectId) => api.get(`/projects/${projectId}/files`);

export const createProjectChatRoom = (projectId, payload) => api.post(
  `/projects/${projectId}/chat-rooms`,
  payload
);

export const listProjectChatRooms = (projectId) => api.get(`/projects/${projectId}/chat-rooms`);

export const getProjectChatMessages = (projectId, roomId) => api.get(
  `/projects/${projectId}/chat-rooms/${roomId}/messages`
);

export const askProjectQuestion = (projectId, payload) => api.post(
  `/projects/${projectId}/ask-question`,
  payload
);
