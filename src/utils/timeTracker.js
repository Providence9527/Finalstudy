const API_URL = import.meta.env.VITE_SERVER_BASE
export class TimeTracker {
    constructor(userId) {
      this.startTime = performance.now();
      this.pathname = window.location.pathname;
      this.userId = userId;
      this.setupBeforeUnload();
    }
  
    setupBeforeUnload() {
      window.addEventListener('beforeunload', this.sendData);
    }
  
    cleanup() {
      window.removeEventListener('beforeunload', this.sendData);
    }
  
    sendData = () => {
      const duration = performance.now() - this.startTime;
      const data = {
        path: this.pathname,
        duration: Math.round(duration / 1000), // 转为秒
        timestamp: new Date().toISOString()
      };
       //console.log("发送时间更新请求",data )
      //console.log('请求方法:', new URL(`${API_URL}/users/${this.userId}/learning-time/`).protocol);
      // 使用sendBeacon可靠发送数据
      navigator.sendBeacon(
        `${API_URL}/api/users/${this.userId}/learning-time/`,
        JSON.stringify(data)
       ); 
    };
  }