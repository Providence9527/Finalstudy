// src/api/learning.js
import axios from 'axios';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json();
};

export const fetchLearningStats = async (userId) => {
  const response = await fetch(`/api/users/${userId}/stats/`);
  if (!response.ok) throw new Error('获取数据失败');
  
  const { data } = await response.json(); // 解构data字段
  
  // 安全访问嵌套数据
  return {
    coursesCompleted: data?.completed_courses || 0,
    dailyStudy: Object.values(data?.daily_study_minutes || {}).reduce((a, b) => (a || 0) + (b || 0), 0),
    totalTime: Object.values(data?.total_study_minutes || {}).reduce((a, b) => (a || 0) + (b || 0), 0),
    weeklyGoal: 600,
    dailyGoal: 120
  };
};

export const fetchOngoingCourses = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/progress?status=ongoing`);
    const { data } = await handleResponse(response);
    
    // console.log(data.map(item => ({

    //   book_id: item.book_id, 
    //   title: item.title,
    //   author: item.author,
    //   fmt: item.fmt,
    //   progress: item.progress,
    //   last_viewed: item.last_viewed?.$date 
    //     ? new Date(item.last_viewed.$date) 
    //     : new Date()
    // })))
    return data.map(item => ({

      book_id: item.book_id, 
      title: item.title,
      author: item.author,
      fmt: item.fmt,
      progress: item.progress,
      last_viewed: item.last_viewed?.$date 
        ? new Date(item.last_viewed.$date) 
        : new Date()
    }));
    
  } catch (error) {
    console.error('获取最近浏览失败:', error);
    return [];
  }
};

export const fetchRecommendations = async (userId) => {
  const response = await fetch(`/api/users/${userId}/recommendations`);
  const { data } = await handleResponse(response);
  return data;
};

export const createAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const axiosInstance = axios.create({
  baseURL: '/api'
});

const createHeaders = () => ({
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchConversations = async (userId) => {
  const response = await axiosInstance.get(
    `/users/${userId}/conversations/`,
    createHeaders()
  );
  // console.log("响应",response)
  return response.data.data.map(conv => ({
    id: conv.conversation_id,
    title: conv.title,
    created_at: conv.created_at,
    updated_at: conv.last_updated
  }));
};

export const fetchConversationMessages = async (userId, conversationId) => {
  const response = await axiosInstance.get(
    `/users/${userId}/conversations/${conversationId}/messages/`,
    createHeaders()
  );
  return response.data.messages.map(msg => ({
    text: msg.content,
    isAI: msg.role === 'assistant',
    timestamp: msg.timestamp
  }));
};

export const saveConversationMessages = async (userId, conversationId, messages) => {
  const formattedMessages = messages.map(msg => ({
    content: msg.text,
    role: msg.isAI ? 'assistant' : 'user',
    timestamp: msg.timestamp || new Date().toISOString()
  }));
  
  await axiosInstance.put(
    `/users/${userId}/conversations/${conversationId}/messages/`,
    { messages: formattedMessages },
    createHeaders()
  );
};

export const createConversation = async (userId, firstMessage) => {
  const response = await axiosInstance.post(
    `/users/${userId}/conversations/`,
    { first_message: firstMessage },
    createHeaders()
  );
  return {
    id: response.data.conversation_id,
    title: response.data.title,
    created_at: response.data.created_at,
    updated_at: response.data.last_updated
  };
};

export const deleteConversation = async (userId, conversationId) => {
  await axiosInstance.delete(
    `/users/${userId}/conversations/${conversationId}/`,
    createHeaders()
  );
};

const ITEMS_PER_PAGE = 12;
export const fetchMaterials = async (params = {}) => {
  const query = new URLSearchParams({
    page: params.page || 1,
    page_size: params.page_size || ITEMS_PER_PAGE,
    search: params.search || '',
    subjects: params.subjects?.join(',') || '',
    publishers: params.publishers?.join(',') || '',
    formats: params.formats?.join(',') || '',
    tags: params.tags?.join(',') || '',
  }).toString();

  const response = await fetch(`/api/materials/?${query}`);
  const { data, pagination } = await handleResponse(response);
  return { data, pagination };
};

export const fetchFilterOptions = async () => {
  const response = await fetch('/api/materials/filter-options/');
  return handleResponse(response);
};

export const fetchBookContent = async (id) => {
  const response = await fetch(`/api/books/${id}/content/`);
  console.log("fbc取回:",response)
  const responseData = await response.json()
    .catch(error => {
      console.error('[API] 响应解析失败', error);
      throw new Error('无效的服务器响应格式');
    });
  // console.log("取回",responseData)
  if (response.ok) {
    if (!responseData.type || !responseData.url) {
      throw new Error('服务器返回了无效的数据格式');
    }
    return responseData;
  }
  throw new Error(responseData.error || '未知错误'); 
};

export const detectFileType = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  return response.headers.get('Content-Type');
};

// 最近浏览书籍记录api接口
export const saveReadingProgress = async (data) => {

  console.log("保存",data)
  const response = await fetch('/api/users/progress/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: data.userId,
      bookId: data.bookId,
      title: data.title,
      author: data.author,
      fmt:data.fmt,
      progress: data.progress, // 0~1之间的浮点数
      lastViewed: new Date().toISOString()
    })
  });
  return response.json(); 
};


// 书架查询相关api接口
export const getFolders = async (userId) => {
  //console.log("[获取文件夹]  ", `/api/users/${userId}/shelf`);
  const response = await fetch(`/api/users/${userId}/shelf`);
  return handleResponse(response);
};



export const createFolder = async (userId, folderName, bookId) => {
  const response = await fetch(`/api/users/${userId}/shelf/`, {  // 添加末尾斜杠
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      folder_name: folderName,
      book_id: bookId
    })
  });
  return handleResponse(response);
};

export const addToFolder = async (userId, folderName, bookId) => {
  const encodedFolder = encodeURIComponent(folderName)
  const requestBody = bookId ? { book_id: bookId } : {}
  
  const response = await fetch(
    `/api/users/${userId}/shelf/${encodedFolder}/`, // 强制带斜杠
    {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined
    }
  )
  return handleResponse(response)
}

export const removeFromFolder = async (userId, folderName, bookId) => {
  const encodedFolder = encodeURIComponent(folderName);
  // console.log("api传入",userId, folderName, bookId)
  const response = await fetch(
    `/api/users/${userId}/book/${encodedFolder}/`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ book_id: bookId })
    }
  );
  return handleResponse(response);
};


export const deleteFolder = async (userId, folderName) => {
  // console.log("api|删除  ",userId, folderName )
   const encodedFolder = encodeURIComponent(folderName);
  //console.log("api|删除  ",encodedFolder)
  const response = await fetch(
    `/api/users/${userId}/shelf/${encodedFolder}/`, 
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  //console.log("api|删除成功,返回响应 ",response)
  return handleResponse(response);
};

export const fetchMaterialsByFolder = async (userId, folderName) => {
  try {
    const response = await axios.get(
      `/api/users/${userId}/shelf/${encodeURIComponent(folderName)}/materials/`
    );
    return response.data;
  } catch (error) {
    console.error('文件夹教材获取失败:', error);
    return { data: [] };
  }
};

export const fetchLastViewed = async (userId) => {
  try {
    const response = await fetch(`/api/users/${userId}/progress/last-viewed/`);
    if (!response.ok) throw new Error('请求失败');
    //console.log("最近取回  ", response)
    const { data } = await response.json();
    //console.log("最近取回数据  ", data)
    return data ? {
      bookId: data.book_id,
      bookTitle: data.title,
      author: data.author,
      fmt: data.fmt,
      lastViewed: data.last_viewed
    } : null;
    
  } catch (error) {
    console.error('获取最近浏览失败:', error);
    return null;
  }
};


// 智能助手接口
export const fetchCurrentMarkdown = async ({ documentUrl, currentPage,userId}) => {
  try {
    //console.log("md准备请求   ",documentUrl, currentPage)
    const safeUrl = documentUrl || '';
    const safePage = currentPage || 1;
    const headers = {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-Id': userId })  // 新增用户ID请求头
    };
    const response = await fetch(`/api/current/markdown?documentUrl=${encodeURIComponent(safeUrl)}&currentPage=${safePage}`,{ headers } );
    if (!response.ok) throw new Error('获取内容失败');

    const { data } = await response.json();
    //console.log("api取回的md数据:  ",data)
    return data?.content || '';
    
  } catch (error) {
    console.error('获取Markdown失败:', error);
    return '';
  }
};




